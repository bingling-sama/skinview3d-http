import { ModelType, RemoteImage, TextureSource } from "skinview-utils";
import { Color, ColorRepresentation, PointLight, Group, PerspectiveCamera, Scene, Texture, WebGLRenderer, AmbientLight, Mapping } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { RootAnimation } from "./animation.js";
import { BackEquipment, PlayerObject } from "./model.js";
export interface LoadOptions {
    /**
     * Whether to make the object visible after the texture is loaded. Default is true.
     */
    makeVisible?: boolean;
}
export interface SkinLoadOptions extends LoadOptions {
    /**
     * The model type of skin. Default is "auto-detect".
     */
    model?: ModelType | "auto-detect";
    /**
     * true: Loads the ears drawn on the skin texture, and show it.
     * "load-only": Loads the ears drawn on the skin texture, but do not make it visible.
     * false: Do not load ears from the skin texture.
     * Default is false.
     */
    ears?: boolean | "load-only";
}
export interface CapeLoadOptions extends LoadOptions {
    /**
     * The equipment (cape or elytra) to show, defaults to "cape".
     * If makeVisible is set to false, this option will have no effect.
     */
    backEquipment?: BackEquipment;
}
export interface EarsLoadOptions extends LoadOptions {
    /**
     * "standalone": The texture is a 14x7 image that only contains the ears;
     * "skin": The texture is a skin that contains ears, and we only show its ear part.
     * Default is "standalone".
     */
    textureType?: "standalone" | "skin";
}
export interface SkinViewerOptions {
    width?: number;
    height?: number;
    skin?: RemoteImage | TextureSource;
    model?: ModelType | "auto-detect";
    cape?: RemoteImage | TextureSource;
    /**
     * If you want to show the ears drawn on the current skin, set this to "current-skin".
     * To show ears that come from a separate texture, you have to specify 'textureType' ("standalone" or "skin") and 'source'.
     * "standalone" means the provided texture is a 14x7 image that only contains the ears.
     * "skin" means the provided texture is a skin that contains ears, and we only show its ear part.
     */
    ears?: "current-skin" | {
        textureType: "standalone" | "skin";
        source: RemoteImage | TextureSource;
    };
    /**
     * Whether the canvas contains an alpha buffer. Default is true.
     * This option can be turned off if you use an opaque background.
     */
    alpha?: boolean;
    /**
     * Render target.
     * A new canvas is created if this parameter is unspecified.
     */
    canvas?: HTMLCanvasElement;
    /**
     * Whether to preserve the buffers until manually cleared or overwritten. Default is false.
     */
    preserveDrawingBuffer?: boolean;
    /**
     * The initial value of `SkinViewer.renderPaused`. Default is false.
     * If this option is true, rendering and animation loops will not start.
     */
    renderPaused?: boolean;
    /**
     * The background of the scene. Default is transparent.
     */
    background?: ColorRepresentation | Texture;
    /**
     * The panorama background to use. This option overrides 'background' option.
     */
    panorama?: RemoteImage | TextureSource;
    /**
     * Camera vertical field of view, in degrees. Default is 50.
     * The distance between the object and the camera is automatically computed.
     */
    fov?: number;
    /**
     * Zoom ratio of the player. Default is 0.9.
     * This value affects the distance between the object and the camera.
     * When set to 1.0, the top edge of the player's head coincides with the edge of the view.
     */
    zoom?: number;
}
export declare class SkinViewer {
    readonly canvas: HTMLCanvasElement;
    readonly scene: Scene;
    readonly camera: PerspectiveCamera;
    readonly renderer: WebGLRenderer;
    readonly playerObject: PlayerObject;
    readonly playerWrapper: Group;
    readonly animations: RootAnimation;
    readonly globalLight: AmbientLight;
    readonly cameraLight: PointLight;
    readonly composer: EffectComposer;
    readonly renderPass: RenderPass;
    readonly fxaaPass: ShaderPass;
    readonly skinCanvas: HTMLCanvasElement;
    readonly capeCanvas: HTMLCanvasElement;
    readonly earsCanvas: HTMLCanvasElement;
    private readonly skinTexture;
    private readonly capeTexture;
    private readonly earsTexture;
    private backgroundTexture;
    private _disposed;
    private _renderPaused;
    private _zoom;
    private animationID;
    private onContextLost;
    private onContextRestored;
    constructor(options?: SkinViewerOptions);
    private updateComposerSize;
    loadSkin(empty: null): void;
    loadSkin<S extends TextureSource | RemoteImage>(source: S, options?: SkinLoadOptions): S extends TextureSource ? void : Promise<void>;
    resetSkin(): void;
    loadCape(empty: null): void;
    loadCape<S extends TextureSource | RemoteImage>(source: S, options?: CapeLoadOptions): S extends TextureSource ? void : Promise<void>;
    resetCape(): void;
    loadEars(empty: null): void;
    loadEars<S extends TextureSource | RemoteImage>(source: S, options?: EarsLoadOptions): S extends TextureSource ? void : Promise<void>;
    resetEars(): void;
    loadPanorama<S extends TextureSource | RemoteImage>(source: S): S extends TextureSource ? void : Promise<void>;
    loadBackground<S extends TextureSource | RemoteImage>(source: S, mapping?: Mapping): S extends TextureSource ? void : Promise<void>;
    private draw;
    /**
    * Renders the scene to the canvas.
    * This method does not change the animation progress.
    */
    render(): void;
    setSize(width: number, height: number): void;
    dispose(): void;
    get disposed(): boolean;
    /**
     * Whether rendering and animations are paused.
     * Setting this property to true will stop both rendering and animation loops.
     * Setting it back to false will resume them.
     */
    get renderPaused(): boolean;
    set renderPaused(value: boolean);
    get width(): number;
    set width(newWidth: number);
    get height(): number;
    set height(newHeight: number);
    get background(): null | Color | Texture;
    set background(value: null | ColorRepresentation | Texture);
    adjustCameraDistance(): void;
    get fov(): number;
    set fov(value: number);
    get zoom(): number;
    set zoom(value: number);
}
