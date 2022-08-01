import { inferModelType, isTextureSource, loadCapeToCanvas, loadEarsToCanvas, loadEarsToCanvasFromSkin, loadImage, loadSkinToCanvas } from "skinview-utils";
import { Color, PointLight, EquirectangularReflectionMapping, Group, NearestFilter, PerspectiveCamera, Scene, Texture, Vector2, WebGLRenderer, AmbientLight } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { RootAnimation } from "./animation.js";
import { PlayerObject } from "./model.js";
export class SkinViewer {
    constructor(options = {}) {
        this.animations = new RootAnimation();
        this.globalLight = new AmbientLight(0xffffff, 0.4);
        this.cameraLight = new PointLight(0xffffff, 0.6);
        this.backgroundTexture = null;
        this._disposed = false;
        this._renderPaused = false;
        this.canvas = options.canvas === undefined ? document.createElement("canvas") : options.canvas;
        // texture
        this.skinCanvas = document.createElement("canvas");
        this.skinTexture = new Texture(this.skinCanvas);
        this.skinTexture.magFilter = NearestFilter;
        this.skinTexture.minFilter = NearestFilter;
        this.capeCanvas = document.createElement("canvas");
        this.capeTexture = new Texture(this.capeCanvas);
        this.capeTexture.magFilter = NearestFilter;
        this.capeTexture.minFilter = NearestFilter;
        this.earsCanvas = document.createElement("canvas");
        this.earsTexture = new Texture(this.earsCanvas);
        this.earsTexture.magFilter = NearestFilter;
        this.earsTexture.minFilter = NearestFilter;
        this.scene = new Scene();
        this.camera = new PerspectiveCamera();
        this.camera.add(this.cameraLight);
        this.scene.add(this.camera);
        this.scene.add(this.globalLight);
        this.renderer = new WebGLRenderer({
            canvas: this.canvas,
            alpha: options.alpha !== false,
            preserveDrawingBuffer: options.preserveDrawingBuffer === true // default: false
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.fxaaPass = new ShaderPass(FXAAShader);
        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.fxaaPass);
        this.playerObject = new PlayerObject(this.skinTexture, this.capeTexture, this.earsTexture);
        this.playerObject.name = "player";
        this.playerObject.skin.visible = false;
        this.playerObject.cape.visible = false;
        this.playerWrapper = new Group();
        this.playerWrapper.add(this.playerObject);
        this.scene.add(this.playerWrapper);
        if (options.skin !== undefined) {
            this.loadSkin(options.skin, {
                model: options.model,
                ears: options.ears === "current-skin"
            });
        }
        if (options.cape !== undefined) {
            this.loadCape(options.cape);
        }
        if (options.ears !== undefined && options.ears !== "current-skin") {
            this.loadEars(options.ears.source, {
                textureType: options.ears.textureType
            });
        }
        if (options.width !== undefined) {
            this.width = options.width;
        }
        if (options.height !== undefined) {
            this.height = options.height;
        }
        if (options.background !== undefined) {
            this.background = options.background;
        }
        if (options.panorama !== undefined) {
            this.loadPanorama(options.panorama);
        }
        this.camera.position.z = 1;
        this._zoom = options.zoom === undefined ? 0.9 : options.zoom;
        this.fov = options.fov === undefined ? 50 : options.fov;
        if (options.renderPaused === true) {
            this._renderPaused = true;
            this.animationID = null;
        }
        else {
            this.animationID = window.requestAnimationFrame(() => this.draw());
        }
        this.onContextLost = (event) => {
            event.preventDefault();
            if (this.animationID !== null) {
                window.cancelAnimationFrame(this.animationID);
                this.animationID = null;
            }
        };
        this.onContextRestored = () => {
            if (!this._renderPaused && !this._disposed && this.animationID === null) {
                this.animationID = window.requestAnimationFrame(() => this.draw());
            }
        };
        this.canvas.addEventListener("webglcontextlost", this.onContextLost, false);
        this.canvas.addEventListener("webglcontextrestored", this.onContextRestored, false);
        this.updateComposerSize();
    }
    updateComposerSize() {
        this.composer.setSize(this.width, this.height);
        const pixelRatio = this.renderer.getPixelRatio();
        this.composer.setPixelRatio(pixelRatio);
        this.fxaaPass.material.uniforms["resolution"].value.x = 1 / (this.width * pixelRatio);
        this.fxaaPass.material.uniforms["resolution"].value.y = 1 / (this.height * pixelRatio);
    }
    loadSkin(source, options = {}) {
        if (source === null) {
            this.resetSkin();
        }
        else if (isTextureSource(source)) {
            loadSkinToCanvas(this.skinCanvas, source);
            this.skinTexture.needsUpdate = true;
            if (options.model === undefined || options.model === "auto-detect") {
                this.playerObject.skin.modelType = inferModelType(this.skinCanvas);
            }
            else {
                this.playerObject.skin.modelType = options.model;
            }
            if (options.makeVisible !== false) {
                this.playerObject.skin.visible = true;
            }
            if (options.ears === true || options.ears == "load-only") {
                loadEarsToCanvasFromSkin(this.earsCanvas, source);
                this.earsTexture.needsUpdate = true;
                if (options.ears === true) {
                    this.playerObject.ears.visible = true;
                }
            }
        }
        else {
            return loadImage(source).then(image => this.loadSkin(image, options));
        }
    }
    resetSkin() {
        this.playerObject.skin.visible = false;
    }
    loadCape(source, options = {}) {
        if (source === null) {
            this.resetCape();
        }
        else if (isTextureSource(source)) {
            loadCapeToCanvas(this.capeCanvas, source);
            this.capeTexture.needsUpdate = true;
            if (options.makeVisible !== false) {
                this.playerObject.backEquipment = options.backEquipment === undefined ? "cape" : options.backEquipment;
            }
        }
        else {
            return loadImage(source).then(image => this.loadCape(image, options));
        }
    }
    resetCape() {
        this.playerObject.backEquipment = null;
    }
    loadEars(source, options = {}) {
        if (source === null) {
            this.resetEars();
        }
        else if (isTextureSource(source)) {
            if (options.textureType === "skin") {
                loadEarsToCanvasFromSkin(this.earsCanvas, source);
            }
            else {
                loadEarsToCanvas(this.earsCanvas, source);
            }
            this.earsTexture.needsUpdate = true;
            if (options.makeVisible !== false) {
                this.playerObject.ears.visible = true;
            }
        }
        else {
            return loadImage(source).then(image => this.loadEars(image, options));
        }
    }
    resetEars() {
        this.playerObject.ears.visible = false;
    }
    loadPanorama(source) {
        return this.loadBackground(source, EquirectangularReflectionMapping);
    }
    loadBackground(source, mapping) {
        if (isTextureSource(source)) {
            if (this.backgroundTexture !== null) {
                this.backgroundTexture.dispose();
            }
            this.backgroundTexture = new Texture();
            this.backgroundTexture.image = source;
            if (mapping !== undefined) {
                this.backgroundTexture.mapping = mapping;
            }
            this.backgroundTexture.needsUpdate = true;
            this.scene.background = this.backgroundTexture;
        }
        else {
            return loadImage(source).then(image => this.loadBackground(image, mapping));
        }
    }
    draw() {
        this.animations.runAnimationLoop(this.playerObject);
        this.render();
        this.animationID = window.requestAnimationFrame(() => this.draw());
    }
    /**
    * Renders the scene to the canvas.
    * This method does not change the animation progress.
    */
    render() {
        this.composer.render();
    }
    setSize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.updateComposerSize();
    }
    dispose() {
        this._disposed = true;
        this.canvas.removeEventListener("webglcontextlost", this.onContextLost, false);
        this.canvas.removeEventListener("webglcontextrestored", this.onContextRestored, false);
        if (this.animationID !== null) {
            window.cancelAnimationFrame(this.animationID);
            this.animationID = null;
        }
        this.renderer.dispose();
        this.skinTexture.dispose();
        this.capeTexture.dispose();
        if (this.backgroundTexture !== null) {
            this.backgroundTexture.dispose();
            this.backgroundTexture = null;
        }
        this.fxaaPass.fsQuad.dispose();
    }
    get disposed() {
        return this._disposed;
    }
    /**
     * Whether rendering and animations are paused.
     * Setting this property to true will stop both rendering and animation loops.
     * Setting it back to false will resume them.
     */
    get renderPaused() {
        return this._renderPaused;
    }
    set renderPaused(value) {
        this._renderPaused = value;
        if (this._renderPaused && this.animationID !== null) {
            window.cancelAnimationFrame(this.animationID);
            this.animationID = null;
        }
        else if (!this._renderPaused && !this._disposed && !this.renderer.getContext().isContextLost() && this.animationID == null) {
            this.animationID = window.requestAnimationFrame(() => this.draw());
        }
    }
    get width() {
        return this.renderer.getSize(new Vector2()).width;
    }
    set width(newWidth) {
        this.setSize(newWidth, this.height);
    }
    get height() {
        return this.renderer.getSize(new Vector2()).height;
    }
    set height(newHeight) {
        this.setSize(this.width, newHeight);
    }
    get background() {
        return this.scene.background;
    }
    set background(value) {
        if (value === null || value instanceof Color || value instanceof Texture) {
            this.scene.background = value;
        }
        else {
            this.scene.background = new Color(value);
        }
        if (this.backgroundTexture !== null && value !== this.backgroundTexture) {
            this.backgroundTexture.dispose();
            this.backgroundTexture = null;
        }
    }
    adjustCameraDistance() {
        let distance = 4.5 + 16.5 / Math.tan(this.fov / 180 * Math.PI / 2) / this.zoom;
        // limit distance between 10 ~ 256 (default min / max distance of OrbitControls)
        if (distance < 10) {
            distance = 10;
        }
        else if (distance > 256) {
            distance = 256;
        }
        this.camera.position.multiplyScalar(distance / this.camera.position.length());
        this.camera.updateProjectionMatrix();
    }
    get fov() {
        return this.camera.fov;
    }
    set fov(value) {
        this.camera.fov = value;
        this.adjustCameraDistance();
    }
    get zoom() {
        return this._zoom;
    }
    set zoom(value) {
        this._zoom = value;
        this.adjustCameraDistance();
    }
}
//# sourceMappingURL=viewer.js.map