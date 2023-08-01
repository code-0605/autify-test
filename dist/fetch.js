var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as fs from 'fs';
import * as path from 'path';
const args = process.argv.slice(2);
args.forEach(arg => {
    if (isValidUrl(arg)) {
        download(arg, args.includes('--metadata'));
    }
});
function isValidUrl(input) {
    try {
        new URL(input);
        return true;
    }
    catch (error) {
        return false;
    }
}
function download(link, metaData) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = new URL(link);
        try {
            const response = yield fetch(link);
            const html = yield response.text();
            url = new URL(response.url);
            const updatedHtml = yield downloadImagesAndReplaceUrls(html, url);
            save(updatedHtml, url.host);
            if (metaData) {
                console.log(`site: ${url.host}`);
                const getLastDate = getLastMetaData(url.host);
                if (getLastDate) {
                    console.log(`last_fetch: ${getLastDate}`);
                }
                else {
                    console.log(`last_fetch: never`);
                }
                getPageInfo(updatedHtml, url);
                console.log("\n");
            }
        }
        catch (error) {
            console.error(error);
        }
    });
}
function getPageInfo(html, url) {
    const linkRegex = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;
    const links = html.match(linkRegex);
    console.log(`num_links: ${links === null || links === void 0 ? void 0 : links.length}`);
    const imageRegex = /<img\s+[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
    const images = html.match(imageRegex);
    console.log(`num_images: ${images === null || images === void 0 ? void 0 : images.length}`);
}
function getLastMetaData(hostname) {
    try {
        return fs.statSync(`${process.cwd()}/${hostname}.html`).mtime;
    }
    catch (error) {
        return undefined;
    }
}
function save(html, name) {
    const dir = `${process.cwd()}/${name}`;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFile(path.join(dir, `${name}.html`), html, function (err) {
        if (err) {
            return console.error(err);
        }
    });
}
function downloadImagesAndReplaceUrls(html, pageUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const imageRegex = /<img\s+[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
        let match;
        let updatedHtml = html;
        while ((match = imageRegex.exec(html)) !== null) {
            const imageUrl = match[1];
            let absoluteImageUrl;
            if (imageUrl.startsWith('/')) {
                absoluteImageUrl = pageUrl.origin + imageUrl;
            }
            else {
                absoluteImageUrl = new URL(imageUrl, pageUrl.href).href;
            }
            const imageFileName = path.basename(new URL(absoluteImageUrl).pathname);
            try {
                yield downloadImage(absoluteImageUrl, imageFileName, pageUrl.host);
                const relativeImagePath = `./images/${imageFileName}`;
                updatedHtml = updatedHtml.replace(imageUrl, relativeImagePath);
            }
            catch (error) {
                console.error(`Failed to download image ${absoluteImageUrl}: ${error}`);
            }
        }
        return updatedHtml;
    });
}
function downloadImage(url, filename, host) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(url);
        const blob = yield response.blob();
        const arrayBuffer = yield blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const dir = `${process.cwd()}/${host}/images`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        yield fs.promises.writeFile(path.join(dir, filename), buffer);
    });
}
