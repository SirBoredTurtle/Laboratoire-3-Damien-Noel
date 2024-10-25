import * as utilities from "./utilities.js";
import * as serverVariables from "./serverVariables.js";

let CachedRequestsExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");

globalThis.CachedRequests = [];
global.startCachedRequestsCleanerStarted = false;

export class CachedRequestsManager {

    static startCachedRequestsCleaner() {
        setInterval(CachedRequestsManager.flushExpired, CachedRequestsExpirationTime * 1000);
        console.log(BgBlue + FgWhite, "[Periodic URL content cache cleaning process started...]");
    }
    static add(url, content, ETag = "") {
        if(startCachedRequestsCleanerStarted == false )
        {
            CachedRequestsManager.startCachedRequestsCleaner();
            startCachedRequestsCleanerStarted = true;
        }
        if (url != "") {
            CachedRequestsManager.clear(url);
            CachedRequests.push({
                url,
                content,
                ETag,
                Expire_Time: utilities.nowInSeconds() + CachedRequestsExpirationTime
            });
            console.log(BgBlue + FgWhite,`[Content for URL ${url} has been cached]`);
        }
    }
    static find(url) {
        try {
            if (url != "") {
                for (let cache of CachedRequests) {
                    if (cache.url == url) {
                        cache.Expire_Time = utilities.nowInSeconds() + CachedRequestsExpirationTime;
                        console.log(BgBlue + FgWhite, `[Content for URL ${cache.url} retrieved from cache]`);
                        return cache.Data;                    
                    }
                }
            }
        } catch (error) {
            console.log(BgBlue+FgRed,"[URL cache error!]", error);
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
        let now = utilities.nowInSeconds();
        for (let cache of CachedRequests) {
            if (cache.Expire_Time <= now) {
                console.log(BgBlue + FgBlue, "Cached file data of " + cache.url + " expired");
            }
        }
        CachedRequests = CachedRequests.filter( cache => cache.Expire_Time > now);
    }
    static get(HttpContext){
        let content = CachedRequestsManager.find(HttpContext.req.url)
        if (content != null){
            HttpContext.response.JSON(content.content, content.Etag, true)
        }
        else{
            CachedRequestsManager.add(HttpContext.req.url,HttpContext.payload,HttpContext.req.ETag);
        }
    }
}