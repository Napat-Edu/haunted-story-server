export interface IPlayerData {
    playerName: string,
    socketId: string,
    isHost: boolean,
    isReady: boolean,
    keywords: {
        mainKey: string,
        subKey: string,
    }
}

export interface IMessage {
    msg: string
}

export interface IKeywordMessage {
    msg: string,
    socketId: string,
    keywords: {
        mainKey: string,
        subKey: string,
    }
}