import abilityAccessCtrl from "@ohos:abilityAccessCtrl";
import type AbilityConstant from "@ohos:app.ability.AbilityConstant";
import type { Permissions } from "@ohos:abilityAccessCtrl";
import UIAbility from "@ohos:app.ability.UIAbility";
import type Want from "@ohos:app.ability.Want";
import hilog from "@ohos:hilog";
import type window from "@ohos:window";
const TAG = 'KrakowBezBarier';
export default class EntryAbility extends UIAbility {
    onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
        hilog.info(0x0000, TAG, '%{public}s', 'Ability onCreate');
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
