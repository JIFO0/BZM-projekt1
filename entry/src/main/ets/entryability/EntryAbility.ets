import { abilityAccessCtrl, AbilityConstant, Configuration, Permissions, UIAbility, Want } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { window } from '@kit.ArkUI';

const TAG = 'KrakowBezBarier';

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    hilog.info(0x0000, TAG, '%{public}s', 'Ability onCreate');
    try {
      if (this.context && this.context.config) {
        if (this.context.config.colorMode !== undefined) {
          AppStorage.setOrCreate('krakowColorMode', this.context.config.colorMode);
        }
        if (this.context.config.fontSizeScale !== undefined) {
          AppStorage.setOrCreate('krakowFontSizeScale', this.context.config.fontSizeScale);
        }
      }
    } catch (err) {
      hilog.warn(0x0000, TAG, 'Failed to store initial config: %{public}s', JSON.stringify(err));
    }
  }

  onConfigurationUpdate(newConfig: Configuration): void {
    hilog.info(0x0000, TAG, 'onConfigurationUpdate: colorMode=%{public}d, fontSizeScale=%{public}f',
      newConfig.colorMode ?? -1, newConfig.fontSizeScale ?? 1.0);
    if (newConfig.colorMode !== undefined) {
      AppStorage.setOrCreate('krakowColorMode', newConfig.colorMode);
    }
    if (newConfig.fontSizeScale !== undefined) {
      AppStorage.setOrCreate('krakowFontSizeScale', newConfig.fontSizeScale);
    }
  }

  onDestroy(): void {
    hilog.info(0x0000, TAG, '%{public}s', 'Ability onDestroy');
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    const permissions: Array<Permissions> = [
      'ohos.permission.APPROXIMATELY_LOCATION',
      'ohos.permission.LOCATION'
    ];
    abilityAccessCtrl.createAtManager()
      .requestPermissionsFromUser(this.context, permissions)
      .catch((err: Object) => {
        hilog.error(0x0000, TAG, 'Location permission request failed: %{public}s', JSON.stringify(err));
      });

    windowStage.loadContent('pages/ReactApp', (err) => {
      if (err.code) {
        hilog.error(0x0000, TAG, 'Failed to load the content. Cause: %{public}s', JSON.stringify(err) ?? '');
        return;
      }
      hilog.info(0x0000, TAG, 'Succeeded in loading the content.');
    });
  }

  onWindowStageDestroy(): void {
    hilog.info(0x0000, TAG, '%{public}s', 'Ability onWindowStageDestroy');
  }

  onForeground(): void {
    hilog.info(0x0000, TAG, '%{public}s', 'Ability onForeground');
  }

  onBackground(): void {
    hilog.info(0x0000, TAG, '%{public}s', 'Ability onBackground');
  }
}
