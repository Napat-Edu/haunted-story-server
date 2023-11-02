import { HttpModule, HttpService } from "@nestjs/axios";
import { Logger, Module, OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ApiProperty } from "@nestjs/swagger";
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { catchError, firstValueFrom } from "rxjs";
import { Server } from "socket.io";
import { IKeywordMessage, IMessage, IPlayerData } from "src/interfaces/playerData.interface";

@WebSocketGateway({
    cors: {
        origin: [process.env.MODE === 'prod' ? process.env.CLIENT_PROD_PATH : process.env.CLIENT_DEV_PATH],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
})
@Module({
    imports: [HttpModule]
})
export class Gateway implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect {

    private readonly logger = new Logger("server-state-logger");

    @WebSocketServer()
    server: Server

    @ApiProperty({ type: [String] })
    players: IPlayerData[]

    constructor(
        private readonly httpService: HttpService,
    ) { }

    onModuleInit() {
        this.players = [];
    }

    handleConnection(client: any) {
        let newPlayer: IPlayerData = {
            playerName: 'newplayer',
            socketId: client.id,
            isHost: false,
            isReady: false,
            keywords: {
                mainKey: "",
                subKey: ""
            }
        };
        this.players.push(newPlayer);
        console.log(this.players);
    }

    handleDisconnect(client: any) {
        console.log(client.id + " disconnect");
        this.removePlayer(client.id);
    }

    @SubscribeMessage('new-player-enter')
    onPlayerEnterGame(@MessageBody() body: IPlayerData) {
        this.updatePlayerName(body.playerName, body.socketId);
        this.updateHostPlayer();
        console.log(this.players);

        this.emitPlayerInfo("New player entered the game");
    }

    @SubscribeMessage('start-game')
    onStartGame(@MessageBody() body: IMessage) {
        console.log(body.msg);
        this.server.emit('game-state', { msg: "Player need to type keyword", isKeywordInputState: true });
    }

    @SubscribeMessage('keyword-input')
    onKeywordInput(@MessageBody() body: IKeywordMessage) {
        this.updatePlayerKeyword(body)

        this.server.to(body.socketId).emit("game-state", { msg: "server got keyword", isKeywordInputState: false, isStoryStart: false });

        if (this.checkAllPlayerKeywords()) {
            this.shuffleKeywords();
            this.emitPlayerInfo("Shuffled the keywords, ready to play!");
            this.server.emit("game-state", { msg: "Begins! let's start the storytelling", isKeywordInputState: false, isStoryStart: true });
        }
    }

    updatePlayerName(playerName: string, socketId: string) {
        const playerIndex = this.players.findIndex((player) => {
            return (player.socketId === socketId);
        });

        this.players[playerIndex].playerName = playerName;
        this.players[playerIndex].isReady = true;
    }

    updateHostPlayer() {
        if (this.players.length >= 1) {
            this.players[0].isHost = true;
        }
    }

    updatePlayerKeyword(@MessageBody() body: IKeywordMessage) {
        const playerIndex = this.players.findIndex((player) => {
            return (player.socketId === body.socketId);
        });

        this.players[playerIndex].keywords = body.keywords;
    }

    removePlayer(socketId: String) {
        const isHostExit = this.players.some((player) => {
            return (player.isHost === true && player.socketId === socketId);
        });

        this.players = this.players.filter((player) => {
            return (player.socketId !== socketId);
        });

        if (isHostExit) {
            this.updateHostPlayer();
        }
        console.log(this.players);
        this.emitPlayerInfo("player exit the game");
    }

    emitPlayerInfo(message: string) {
        this.server.emit('update-room-info', {
            msg: message,
            players: this.players
        });
    }

    checkAllPlayerKeywords(): boolean {
        const isPlayerHaveKeywords = this.players.every((player) => {
            return (player.keywords.mainKey !== "" && player.keywords.subKey !== "");
        });

        return isPlayerHaveKeywords;
    }

    shuffleKeywords() {
        const shuffledPlayers: IPlayerData[] = [...this.players];

        for (let i = shuffledPlayers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i));
            const k = Math.floor(Math.random() * (i));

            const tempMainKeywords = shuffledPlayers[i].keywords.mainKey;
            shuffledPlayers[i].keywords.mainKey = shuffledPlayers[j].keywords.mainKey;
            shuffledPlayers[j].keywords.mainKey = tempMainKeywords;

            const tempSubKeywords = shuffledPlayers[i].keywords.subKey;
            shuffledPlayers[i].keywords.subKey = shuffledPlayers[k].keywords.subKey;
            shuffledPlayers[k].keywords.subKey = tempSubKeywords;
        }

        this.players = shuffledPlayers;
    }

    @Cron("0 */14 * * * *")
    async cronAwakeServer() {
        this.logger.debug('Awake server every 14 minutes');
        const API_PATH = process.env.MODE === 'prod' ? process.env.SERVER_PROD_PATH : process.env.SERVER_DEV_PATH;
        const response = await firstValueFrom(
            this.httpService.get(API_PATH).pipe(
                catchError((err: any) => {
                    throw err;
                })
            )
        );
        console.log(response.data);
    }
}