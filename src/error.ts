interface IServerError {
  code: number;
  text: string;
  error?: string;
}

// no stacktrace error
export class ServerError implements IServerError {
  code: number;
  text: string;
  error?: string;

  constructor(obj: IServerError) {
    this.code = obj.code;
    this.text = obj.text;
    this.error = obj.error;
  }

  toString() {
    switch (this.code) {
      default:
        if (this.error) return this.text + ': ' + this.error;
        return this.text;
    }
  }
}
