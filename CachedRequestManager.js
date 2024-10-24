import * as utilities from "./utilities.js";
import * as serverVariables from "./serverVariables.js";

let repositoryCachesExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");

globalThis.CachedRequests = [];
global.startCachedRequestsCleanerStarted = false;

export class CachedRequestsManager {

    static startCachedRequestsCleaner() {
        setInterval(CachedRequestsManager.flushExpired, repositoryCachesExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic URL content cache cleaning process started...]");
    }
    static add(url, content, ETag = "") {
        if(this.startCachedRequestsCleanerStarted == false )
        {
            startCachedRequestsCleaner();
            startCachedRequestsCleanerStarted = true;
        }
        if (url != "") {
            CachedRequestsManager.clear(url);
            CachedRequests.push({
                url,
                content,
                ETag,
                Expire_Time: utilities.nowInSeconds() + repositoryCachesExpirationTime
            });
            console.log(`[Content for URL ${url} has been cached]`);
        }
    }
    static find(url) {
        try {
            if (url != "") {
                for (let cache of CachedRequests) {
                    if (cache.url == url) {
                        cache.Expire_Time = utilities.nowInSeconds() + repositoryCachesExpirationTime;
                        console.log(BgWhite + FgBlue, `[Content for URL ${cache.url} retrieved from cache]`);
                        return cache.data;                    
                    }
                }
            }
        } catch (error) {
            console.log(BgWhite+FgRed,"[URL cache error!]", error);
        }
        return null;
    }

    static clear(url) {
        if (url != "") {
            let indexToDelete = [];
            let index = 0;
            for (let cache of CachedRequests) {
                if (cache.url == url) indexToDelete.push(index);
                index++;
            }
            utilities.deleteByIndex(CachedRequests, indexToDelete);
        }
    }
    static flushExpired() {
        let indexToDelete = [];
        let index = 0;
        let now = utilities.nowInSeconds();
        for (let cache of CachedRequests) {
            if (cache.Expire_Time < now) {
                console.log(BgWhite + FgBlue, `[Cached content for URL ${cache.url} expired]`);
                indexToDelete.push(index);
            }
            index++;
        }
        utilities.deleteByIndex(CachedRequests, indexToDelete);
    }
    static get(HttpContext) {
        const url = HttpContext.req.url;
        const ETag = HttpContext.response.ETag
        const content = HttpContext.payload;
        let Data = CachedRequestsManager.find(HttpContext.req.url)
        if (Data != null){
            HttpContext.response.JSON(Data.content, Data.Etag, true)
        }
        else
        {
            CachedRequestsManager.add(url,content,ETag, false)
        }
    }
}