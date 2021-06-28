import {TextDocumentContentProvider, EventEmitter, Uri} from "vscode";

export class TextDocumentProvider implements TextDocumentContentProvider {
  onDidChangeEmitter = new EventEmitter<Uri>();
  onDidChange = this.onDidChangeEmitter.event;
  bodyText = "";
  provideTextDocumentContent(): string {
    return this.bodyText;
  }
  setBodyText(text: string) {
    this.bodyText = text;
    return;
  }
}
