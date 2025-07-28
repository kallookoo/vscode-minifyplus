// Imports
import * as vscode from 'vscode';

type configOption = Record<string, unknown>;

interface ToolSettings {
  settings: configOption;
  config: configOption;
}

type ToolsConfiguration = Record<string, ToolSettings>;

class MinifyPlus {
  private activate = false;

  private config: vscode.WorkspaceConfiguration;

  private currentTool?: string;

  private languageId?: string;

  constructor(context: vscode.ExtensionContext) {
    this.config = vscode.workspace.getConfiguration('minifyplus');
    // Always initialize in disabled state
    vscode.commands.executeCommand('setContext', 'minifyplus.extensionEnabled', false);

    context.subscriptions.push(
      // Language listener
      this.onDidChangeActiveTextEditor(),
      // Check configuration changes
      this.onDidChangeConfiguration()
    );
  }

  getCurrentTool(): void {
    const languages: configOption = this.config
      ? this.config.get<configOption>('tools.languages', {})
      : {};
    if (this.languageId && languages && Object.hasOwn(languages, this.languageId)) {
      this.currentTool = languages[this.languageId] as string;
    }
  }

  getConfig<T>(name: string, defaultValue?: T): T {
    let value = this.config.get(name);

    if (this.languageId) {
      this.getCurrentTool();
      const toolsConfig: ToolsConfiguration = this.config.get<ToolsConfiguration>(
        'tools.configuration',
        {}
      );
      if (toolsConfig && Object.hasOwn(toolsConfig, this.languageId)) {
        const toolConfig = toolsConfig[this.languageId];
        if (toolConfig?.settings && Object.hasOwn(toolConfig, name)) {
          value = toolConfig.settings[name];
        }
      }
    }

    return value ? (value as T) : (defaultValue as T);
  }

  setContext(editor: vscode.TextEditor | undefined): void {
    this.languageId = editor?.document.languageId ?? undefined;
    this.currentTool = undefined;
    this.activate = false;

    if (this.languageId) {
      this.activate =
        this.languageId &&
        Object.hasOwn(this.getConfig('tools.languages', {}) as object, this.languageId)
          ? true
          : false;
    }
    vscode.commands.executeCommand('setContext', 'minifyplus.extensionEnabled', this.activate);
  }

  onDidChangeActiveTextEditor(): vscode.Disposable {
    return vscode.window.onDidChangeActiveTextEditor((editor) => {
      this.setContext(editor);
    });
  }

  onDidChangeConfiguration(): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('minifyplus')) {
        // Debug
        vscode.window.showInformationMessage('MinifyPlus Updated');
        // Update the config
        this.config = vscode.workspace.getConfiguration('minifyplus');
        // Set the current context
        this.setContext(vscode.window.activeTextEditor);
      }
    });
  }
}

export function activate(context: vscode.ExtensionContext): void {
  new MinifyPlus(context);
  // const config = vscode.workspace.getConfiguration('minifyplus');
  // const configTools = config.get<object>('tools');
  // vscode.window.showInformationMessage('configTools: ' + JSON.stringify(configTools));
  // vscode.commands.executeCommand('setContext', 'minifyplus.contextMenuEnabled', true);

  // const disposable = vscode.commands.registerCommand('minifyplus.minify', async () => {
  //   // TODO: Add minification logic here
  //   vscode.window.showInformationMessage('MinifyPlus: command executed');
  // });
  // context.subscriptions.push(disposable);
}

export function deactivate(): void {
  vscode.commands.executeCommand('setContext', 'minifyplus.extensionEnabled', false);
}
