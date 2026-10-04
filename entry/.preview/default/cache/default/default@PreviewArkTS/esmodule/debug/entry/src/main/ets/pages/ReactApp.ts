if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface ReactApp_Params {
    controller?: webview.WebviewController;
}
import webview from "@ohos:web.webview";
class ReactApp extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.controller = new webview.WebviewController();
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: ReactApp_Params) {
        if (params.controller !== undefined) {
            this.controller = params.controller;
        }
    }
    updateStateVars(params: ReactApp_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private controller: webview.WebviewController;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/ReactApp.ets(9:5)", "entry");
            Column.width('100%');
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Web.create({ src: { "id": 0, "type": 30000, params: ['www/index.html'], "bundleName": "com.krakow.bezbarier", "moduleName": "entry" }, controller: this.controller });
            Web.debugLine("entry/src/main/ets/pages/ReactApp.ets(10:7)", "entry");
            Web.javaScriptAccess(true);
            Web.domStorageAccess(true);
            Web.fileAccess(true);
            Web.imageAccess(true);
            Web.onlineImageAccess(true);
            Web.geolocationAccess(true);
            Web.mixedMode(MixedMode.All);
            Web.width('100%');
            Web.height('100%');
            Web.onGeolocationShow((event) => {
                if (event) {
                    event.geolocation.invoke(event.origin, true, false);
                }
            });
        }, Web);
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "ReactApp";
    }
}
registerNamedRoute(() => new ReactApp(undefined, {}), "", { bundleName: "com.krakow.bezbarier", moduleName: "entry", pagePath: "pages/ReactApp", pageFullPath: "entry/src/main/ets/pages/ReactApp", integratedHsp: "false", moduleType: "followWithHap" });
