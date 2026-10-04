import { webview } from '@kit.ArkWeb';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { vibrator, sensor } from '@kit.SensorServiceKit';
import { batteryInfo, deviceInfo, BusinessError } from '@kit.BasicServicesKit';
import { connection } from '@kit.NetworkKit';
import { geoLocationManager } from '@kit.LocationKit';
import { picker } from '@kit.CoreFileKit';
import { common, ConfigurationConstant } from '@kit.AbilityKit';

const TAG = 'KrakowWeb';

class NativeHarmonyBridge {
  private heading: number = 0;
  private context?: common.UIAbilityContext;
  private cachedLocation: string = '';
  private locationStarted: boolean = false;

  constructor(context?: common.UIAbilityContext) {
    this.context = context;
    try {
      sensor.on(sensor.SensorId.ORIENTATION, (data: sensor.OrientationResponse) => {
        if (data && typeof data.alpha === 'number') {
          this.heading = data.alpha;
        }
      }, { interval: 'normal' });
    } catch (err) {
      hilog.warn(0x0000, TAG, 'sensor.on ORIENTATION failed: %{public}s', JSON.stringify(err));
    }
    this.startLocation();
  }

  startLocation(): void {
    if (!this.locationStarted) {
      this.locationStarted = true;
      const request: geoLocationManager.LocationRequest = {
        priority: geoLocationManager.LocationRequestPriority.FIRST_FIX,
        scenario: geoLocationManager.LocationRequestScenario.NAVIGATION,
        timeInterval: 2,
        distanceInterval: 0,
        maxAccuracy: 0
      };
      try {
        geoLocationManager.on('locationChange', request, (location: geoLocationManager.Location) => {
          this.rememberLocation(location);
        });
      } catch (err) {
        hilog.warn(0x0000, TAG, 'locationChange subscribe failed: %{public}s', JSON.stringify(err));
        this.locationStarted = false;
      }
    }
    this.refreshLocation();
  }

  private rememberLocation(location: geoLocationManager.Location): void {
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      return;
    }
    this.cachedLocation = JSON.stringify({
      lat: location.latitude,
      lon: location.longitude,
      accuracy: location.accuracy ?? 0
    });
  }

  private refreshLocation(): void {
    const current: geoLocationManager.CurrentLocationRequest = {
      priority: geoLocationManager.LocationRequestPriority.FIRST_FIX,
      scenario: geoLocationManager.LocationRequestScenario.UNSET,
      maxAccuracy: 0
    };
    try {
      geoLocationManager.getCurrentLocation(current).then((location: geoLocationManager.Location) => {
        this.rememberLocation(location);
      }).catch((err: Object) => {
        hilog.warn(0x0000, TAG, 'getCurrentLocation failed: %{public}s', JSON.stringify(err));
      });
    } catch (err) {
      hilog.warn(0x0000, TAG, 'getCurrentLocation exception: %{public}s', JSON.stringify(err));
    }
  }

  isHarmonyOS(): boolean {
    return true;
  }

  getDeviceInfo(): string {
    const brand = deviceInfo.brand ?? 'Huawei';
    const model = deviceInfo.productModel ?? 'OpenHarmony Device';
    return `${brand} ${model}`;
  }

  getHeading(): number {
    return this.heading;
  }

  getSystemHealth(): string {
    try {
      const soc = batteryInfo.batterySOC;
      const hasNet = connection.hasDefaultNetSync();
      return JSON.stringify({
        batterySoc: soc,
        isOnline: hasNet,
        isLowPower: soc <= 15,
      });
    } catch (err) {
      return JSON.stringify({
        batterySoc: 100,
        isOnline: true,
        isLowPower: false,
      });
    }
  }

  getColorMode(): string {
    try {
      const stored = AppStorage.get<number>('krakowColorMode');
      if (stored !== undefined) {
        return stored === ConfigurationConstant.ColorMode.COLOR_MODE_DARK ? 'dark' : 'light';
      }
      if (this.context && this.context.config) {
        return this.context.config.colorMode === ConfigurationConstant.ColorMode.COLOR_MODE_DARK ? 'dark' : 'light';
      }
    } catch (err) {
      hilog.warn(0x0000, TAG, 'getColorMode failed: %{public}s', JSON.stringify(err));
    }
    return 'light';
  }

  getFontSizeScale(): number {
    try {
      const stored = AppStorage.get<number>('krakowFontSizeScale');
      if (typeof stored === 'number' && stored > 0) {
        return stored;
      }
      if (this.context && this.context.config && typeof this.context.config.fontSizeScale === 'number') {
        return this.context.config.fontSizeScale;
      }
    } catch (err) {
      hilog.warn(0x0000, TAG, 'getFontSizeScale failed: %{public}s', JSON.stringify(err));
    }
    return 1.0;
  }

  getNativeLocation(): string {
    if (this.cachedLocation.length > 0) {
      return this.cachedLocation;
    }
    try {
      const loc = geoLocationManager.getLastLocation();
      if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
        this.rememberLocation(loc);
        return this.cachedLocation;
      }
    } catch (err) {
      hilog.warn(0x0000, TAG, 'geoLocationManager.getLastLocation failed: %{public}s', JSON.stringify(err));
    }
    this.refreshLocation();
    return '';
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

  aboutToAppear(): void {
    try {
      this.bridge = new NativeHarmonyBridge(getContext(this) as common.UIAbilityContext);
    } catch (err) {
      hilog.warn(0x0000, TAG, 'Bridge context initialization failed: %{public}s', JSON.stringify(err));
    }
  }

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
          methodList: [
            "vibrate",
            "isHarmonyOS",
            "getDeviceInfo",
            "getHeading",
            "getSystemHealth",
            "getColorMode",
            "getFontSizeScale",
            "getNativeLocation"
          ],
          controller: this.controller
        })
        .width('100%')
        .height('100%')
        .onGeolocationShow((event) => {
          if (event) {
            this.bridge.startLocation();
            event.geolocation.invoke(event.origin, true, false);
          }
        })
        .onShowFileSelector((event) => {
          if (!event) {
            return false;
          }
          try {
            const photoSelectOptions = new picker.PhotoSelectOptions();
            photoSelectOptions.MIMEType = picker.PhotoViewMIMETypes.IMAGE_TYPE;
            photoSelectOptions.maxSelectNumber = 1;
            const photoPicker = new picker.PhotoViewPicker();
            photoPicker.select(photoSelectOptions).then((result: picker.PhotoSelectResult) => {
              const uris = result.photoUris ?? [];
              event.result.handleFileList(uris);
            }).catch((err: Object) => {
              hilog.warn(0x0000, TAG, 'photo picker failed: %{public}s', JSON.stringify(err));
              event.result.handleFileList([]);
            });
          } catch (err) {
            hilog.warn(0x0000, TAG, 'photo picker exception: %{public}s', JSON.stringify(err));
            event.result.handleFileList([]);
          }
          return true;
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
