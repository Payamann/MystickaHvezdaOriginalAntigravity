import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { jest } from '@jest/globals';

const ROOT_DIR = path.resolve(process.cwd());
const source = fs.readFileSync(path.join(ROOT_DIR, 'js', 'share-image-canvas.js'), 'utf8');
const globalKeys = ['window', 'document', 'navigator', 'Image', 'File', 'URL'];
const originals = Object.fromEntries(globalKeys.map(key => [key, globalThis[key]]));

let canvas;
let anchors;
let analytics;
let objectUrls;
let nativeShare;

class FakeFile {
    constructor(parts, name, options) {
        this.parts = parts;
        this.name = name;
        this.type = options?.type;
    }
}

function makeCanvas(blob = { type: 'image/png' }) {
    return {
        toBlob: callback => callback(blob)
    };
}

function installGlobals() {
    canvas = makeCanvas();
    anchors = [];
    analytics = { trackAction: jest.fn() };
    objectUrls = [];
    nativeShare = jest.fn();

    const body = {
        appendChild: jest.fn(link => {
            anchors.push(link);
            return link;
        })
    };
    globalThis.window = { MH_ANALYTICS: analytics };
    globalThis.navigator = {
        share: nativeShare,
        canShare: jest.fn(() => true)
    };
    globalThis.Image = class {
        set src(value) { this.source = value; }
    };
    globalThis.File = FakeFile;
    globalThis.URL = {
        createObjectURL: jest.fn(file => {
            const url = `blob:preview-${objectUrls.length + 1}`;
            objectUrls.push({ file, url });
            return url;
        }),
        revokeObjectURL: jest.fn()
    };
    globalThis.document = {
        body,
        createElement: jest.fn(tag => {
            if (tag === 'canvas') return canvas;
            if (tag === 'a') {
                return {
                    download: '', href: '', click: jest.fn(),
                    remove: jest.fn()
                };
            }
            throw new Error(`Unexpected element: ${tag}`);
        })
    };

    vm.runInNewContext(source, {
        window: globalThis.window,
        document: globalThis.document,
        navigator: globalThis.navigator,
        Image: globalThis.Image,
        File: globalThis.File,
        URL: globalThis.URL,
        setTimeout: globalThis.setTimeout,
        clearTimeout: globalThis.clearTimeout,
        console
    }, { filename: 'js/share-image-canvas.js' });
}

beforeEach(() => {
    jest.useFakeTimers();
    installGlobals();
});

afterEach(() => {
    jest.useRealTimers();
});

afterAll(() => {
    for (const [key, value] of Object.entries(originals)) {
        if (value === undefined) delete globalThis[key];
        else globalThis[key] = value;
    }
});

test('preferDownload creates a PNG anchor without native share and revokes it after the delay', async () => {
    const result = await window.MH_SHARE_IMAGE.shareOrDownload({
        canvas,
        fileName: 'preview.png',
        eventBase: 'preview',
        preferDownload: true
    });

    expect(result).toBe('downloaded');
    expect(nativeShare).not.toHaveBeenCalled();
    expect(document.body.appendChild).toHaveBeenCalledTimes(1);
    expect(anchors[0].download).toBe('preview.png');
    expect(anchors[0].href).toBe('blob:preview-1');
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    jest.advanceTimersByTime(60000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-1');
    expect(analytics.trackAction).toHaveBeenCalledWith('preview_saved', {
        share_target: 'download', format: 'png'
    });
});

test('aborted native share returns cancelled without download or saved event', async () => {
    nativeShare.mockRejectedValueOnce(Object.assign(new Error('cancelled'), { name: 'AbortError' }));

    const result = await window.MH_SHARE_IMAGE.shareOrDownload({
        canvas,
        fileName: 'preview.png',
        eventBase: 'preview'
    });

    expect(result).toBe('cancelled');
    expect(nativeShare).toHaveBeenCalledTimes(1);
    expect(document.body.appendChild).not.toHaveBeenCalled();
    expect(analytics.trackAction).toHaveBeenCalledWith('preview_share_cancelled', {});
    expect(analytics.trackAction).not.toHaveBeenCalledWith('preview_saved', expect.anything());
});

test('failed blob conversion propagates and does not create a download or saved event', async () => {
    canvas = makeCanvas(null);

    await expect(window.MH_SHARE_IMAGE.shareOrDownload({
        canvas,
        fileName: 'preview.png',
        eventBase: 'preview',
        preferDownload: true
    })).rejects.toThrow('Canvas render produced no blob.');

    expect(document.body.appendChild).not.toHaveBeenCalled();
    expect(analytics.trackAction).not.toHaveBeenCalledWith('preview_saved', expect.anything());
});
