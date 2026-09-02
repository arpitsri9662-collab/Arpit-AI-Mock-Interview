declare module 'async-retry' {
  function asyncRetry<T>(fn: (bail: (error: Error) => void, attempt: number) => Promise<T>, opts?: any): Promise<T>;
  export = asyncRetry;
}

declare module 'pdf-parse' {
  function parse(dataBuffer: Buffer): Promise<any>;
  export = parse;
}
