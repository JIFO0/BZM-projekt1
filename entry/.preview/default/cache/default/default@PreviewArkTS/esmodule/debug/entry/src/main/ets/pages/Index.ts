if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Index_Params {
    controller?: webview.WebviewController;
    showReact?: boolean;
}
import webview from "@ohos:web.webview";
class Index extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.controller = new webview.WebviewController();
        this.__showReact = new ObservedPropertySimplePU(false, this, "showReact");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Index_Params) {
        if (params.controller !== undefined) {
            this.controller = params.controller;
        }
        if (params.showReact !== undefined) {
            this.showReact = params.showReact;
        }
    }
    updateStateVars(params: Index_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__showReact.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__showReact.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private controller: webview.WebviewController;
    private __showReact: ObservedPropertySimplePU<boolean>;
    get showReact() {
        return this.__showReact.get();
    }
    set showReact(newValue: boolean) {
        this.__showReact.set(newValue);
    }
    aboutToAppear(): void {
        try {
            this.showReact = this.getUIContext().getHostContext() !== undefined;
        }
        catch (err) {
            this.showReact = false;
        }
    }
    previewNotice(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/pages/Index.ets(19:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.justifyContent(FlexAlign.Center);
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(24);
            Column.backgroundColor('#208AEF');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Kraków bez barier');
            Text.debugLine("entry/src/main/ets/pages/Index.ets(20:7)", "entry");
            Text.fontSize(28);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#FFFFFF');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Podgląd DevEco nie rysuje komponentu Web, w którym działa React. Szary napis „Preview is not available” nie oznacza, że aplikacja jest zepsuta.');
            Text.debugLine("entry/src/main/ets/pages/Index.ets(24:7)", "entry");
            Text.fontSize(16);
            Text.fontColor('#FFFFFF');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Uruchom moduł entry na emulatorze albo telefonie. Tam ładuje się wyeksportowany interfejs.');
            Text.debugLine("entry/src/main/ets/pages/Index.ets(27:7)", "entry");
            Text.fontSize(16);
            Text.fontColor('#FFFFFF');
        }, Text);
        Text.pop();
        Column.pop();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.showReact) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Index.ets(41:7)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Web.create({ src: { "id": 0, "type": 30000, params: ['www/index.html'], "bundleName": "com.krakow.bezbarier", "moduleName": "entry" }, controller: this.controller });
                        Web.debugLine("entry/src/main/ets/pages/Index.ets(42:9)", "entry");
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
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.previewNotice.bind(this)();
                });
            }
        }, If);
        If.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "Index";
    }
}
registerNamedRoute(() => new Index(undefined, {}), "", { bundleName: "com.krakow.bezbarier", moduleName: "entry", pagePath: "pages/Index", pageFullPath: "entry/src/main/ets/pages/Index", integratedHsp: "false", moduleType: "followWithHap" });
