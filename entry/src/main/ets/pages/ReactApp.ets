import { webview } from '@kit.ArkWeb';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { vibrator } from '@kit.SensorServiceKit';
import { BusinessError, deviceInfo } from '@kit.BasicServicesKit';

const TAG = 'KrakowWeb';

class NativeHarmonyBridge {
  isHarmonyOS(): boolean {
    return true;
  }

  getDeviceInfo(): string {
    const brand = deviceInfo.brand ?? 'Huawei';
    const model = deviceInfo.productModel ?? 'OpenHarmony Device';
    return `${brand} ${model}`;
  }

  vibrate(durationMs?: number): void {
    const duration = (durationMs && durationMs > 0 && durationMs <= 1000) ? durationMs : 40;
    try {
      vibrator.startVibration({
        type: 'time',
        duration: duration,
      }, {
        id: 0,
        usage: 'physicalFeedback',
      }, (error: BusinessError) => {
        if (error) {
          hilog.warn(0x0000, TAG, 'startVibration callback error: %{public}s', JSON.stringify(error));
        } else {
          hilog.info(0x0000, TAG, 'startVibration success: %{public}d ms', duration);
        }
      });
    } catch (err) {
      hilog.warn(0x0000, TAG, 'startVibration exception: %{public}s', JSON.stringify(err));
    }
  }
}

@Entry
@Component
struct ReactApp {
  controller: webview.WebviewController = new webview.WebviewController();
  bridge: NativeHarmonyBridge = new NativeHarmonyBridge();

  build() {
    Column() {
      Web({ src: $rawfile('www/index.html'), controller: this.controller })
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .fileAccess(true)
        .imageAccess(true)
        .onlineImageAccess(true)
        .geolocationAccess(true)
        .mixedMode(MixedMode.All)
        .javaScriptProxy({
          object: this.bridge,
          name: "HarmonyBridge",
          methodList: ["vibrate", "isHarmonyOS", "getDeviceInfo"],
          controller: this.controller
        })
        .width('100%')
        .height('100%')
        .onGeolocationShow((event) => {
          if (event) {
            event.geolocation.invoke(event.origin, true, false);
          }
        })
        .onPageEnd(() => {
          this.controller.runJavaScript(
            "JSON.stringify({href:location.href,path:location.pathname,root:((document.getElementById('root')&&document.getElementById('root').innerText)||'').slice(0,500),err:(document.getElementById('harmony-boot-error')||{}).textContent||''})"
          ).then((value: string) => {
            hilog.info(0x0000, TAG, 'dom %{public}s', value ?? '');
          }).catch((err: Object) => {
            hilog.error(0x0000, TAG, 'js %{public}s', JSON.stringify(err));
          });
        })
        .onErrorReceive((event) => {
          if (event) {
            hilog.error(0x0000, TAG, 'load %{public}s', event.error.getErrorInfo());
          }
        })
        .onConsole((event) => {
          if (event) {
            const message = event.message;
            hilog.info(0x0000, TAG, 'console %{public}s:%{public}d %{public}s',
              message.getSourceId(), message.getLineNumber(), message.getMessage());
          }
          return false;
        })
    }
    .width('100%')
    .height('100%')
  }
}
