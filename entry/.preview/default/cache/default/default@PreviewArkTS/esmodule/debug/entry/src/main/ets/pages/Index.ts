if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Index_Params {
    status?: string;
}
import router from "@ohos:router";
import deviceInfo from "@ohos:deviceInfo";
class Index extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__status = new ObservedPropertySimplePU('Ładowanie aplikacji…', this, "status");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Index_Params) {
        if (params.status !== undefined) {
            this.status = params.status;
        }
    }
    updateStateVars(params: Index_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__status.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__status.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __status: ObservedPropertySimplePU<string>;
    get status() {
        return this.__status.get();
    }
    set status(newValue: string) {
        this.__status.set(newValue);
    }
    aboutToAppear(): void {
        const model = deviceInfo.productModel ?? '';
        const preview = model.length === 0 || model.toLowerCase().includes('preview');
        if (preview) {
            this.status = 'Podgląd ArkUI jest gotowy. React otwiera się na emulatorze.';
            return;
        }
        router.replaceUrl({ url: 'pages/ReactApp' }).catch(() => {
            this.status = 'Nie udało się otworzyć interfejsu React.';
        });
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 12 });
            Column.debugLine("entry/src/main/ets/pages/Index.ets(22:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.justifyContent(FlexAlign.Center);
            Column.padding(24);
            Column.backgroundColor('#208AEF');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Kraków bez barier');
            Text.debugLine("entry/src/main/ets/pages/Index.ets(23:7)", "entry");
            Text.fontSize(32);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#FFFFFF');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.status);
            Text.debugLine("entry/src/main/ets/pages/Index.ets(27:7)", "entry");
            Text.fontSize(16);
            Text.fontColor('#FFFFFF');
            Text.width('100%');
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "Index";
    }
}
registerNamedRoute(() => new Index(undefined, {}), "", { bundleName: "com.krakow.bezbarier", moduleName: "entry", pagePath: "pages/Index", pageFullPath: "entry/src/main/ets/pages/Index", integratedHsp: "false", moduleType: "followWithHap" });
