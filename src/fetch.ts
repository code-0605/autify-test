import * as fs from 'fs';
import * as path from 'path';

const args: string[] = process.argv.slice(2);

args.forEach(arg => {
    if (isValidUrl(arg)) {
        download(arg, args.includes('--metadata'));
    }
});

function isValidUrl(input: string) {
    try {
      new URL(input);
      return true;
    } catch (error) {
      return false;
    }
}

async function download(link: string, metaData?: boolean) {
    let url = new URL(link);

    try {
        const response = await fetch(link);
        const html = await response.text();
        url = new URL(response.url)
        const updatedHtml = await downloadImagesAndReplaceUrls(html, url);

        save(updatedHtml, url.host);

        if (metaData) {
            console.log(`site: ${url.host}`);
            const getLastDate = getLastMetaData(url.host);
            if (getLastDate) {
                console.log(`last_fetch: ${getLastDate}`);
            } else {
                console.log(`last_fetch: never`);
            }
            getPageInfo(updatedHtml, url);

            console.log("\n");
        }
    } catch (error) {
        console.error(error);
    }
}

function getPageInfo(html: string, url: URL) {

    const linkRegex = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;
    const links = html.match(linkRegex);
    console.log(`num_links: ${links?.length}`);

    const imageRegex = /<img\s+[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
    const images = html.match(imageRegex);
    console.log(`num_images: ${images?.length}`);
}

function getLastMetaData(hostname: string): Date|undefined {
    try {
        return fs.statSync(`${process.cwd()}/${hostname}.html`).mtime;
    } catch (error) {
        return undefined;
    }
}

function save(html: string, name: string) {
    const dir = `${process.cwd()}/${name}`;

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFile(path.join(dir, `${name}.html`), html, function(err) {
        if(err) {
            return console.error(err);
        }
    }); 
}

async function downloadImagesAndReplaceUrls(html: string, pageUrl: URL): Promise<string> {
    const imageRegex = /<img\s+[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
    let match;
    let updatedHtml = html;

    while ((match = imageRegex.exec(html)) !== null) {
        const imageUrl = match[1];
        let absoluteImageUrl;

        if (imageUrl.startsWith('/')) {
            absoluteImageUrl = pageUrl.origin + imageUrl;
        } else {
            absoluteImageUrl = new URL(imageUrl, pageUrl.href).href;
        }

        const imageFileName = path.basename(new URL(absoluteImageUrl).pathname);

        try {
            await downloadImage(absoluteImageUrl, imageFileName, pageUrl.host);
            const relativeImagePath = `./images/${imageFileName}`;
            updatedHtml = updatedHtml.replace(imageUrl, relativeImagePath);
        } catch (error) {
            console.error(`Failed to download image ${absoluteImageUrl}: ${error}`);
        }
    }

    return updatedHtml;
}

async function downloadImage(url: string, filename: string, host: string): Promise<void> {
    const response = await fetch(url);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const dir = `${process.cwd()}/${host}/images`;

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(path.join(dir, filename), buffer);
}
