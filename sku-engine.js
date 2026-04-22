/**
 * Warehouse SKU Generator - Core Logic Engine (v18+)
 * Hosted on GitHub, consumed by SKU_Generator_Client.html via jsDelivr
 */
function extractSKU(rawTitle) {
    const title = rawTitle.toUpperCase();
    let data = {
        base: "",
        cpu: "",
        ram: "",
        storage: "",
        features: [],
        condition: "",
        hasKb: false,
        hasNoKb: false
    };

    // ==========================================
    // 1. KEYBOARD DETECTION
    // ==========================================
    const noKbRegex = /\b(NO|W\/O|WITHOUT)\s+KEYB(?:OA|AO)?RD\b/i;
    data.hasNoKb = noKbRegex.test(rawTitle);
    
    const kbRegex = /\b(?:WITH\s+)?KEYB(?:OA|AO)?RD\b/i;
    data.hasKb = !data.hasNoKb && kbRegex.test(rawTitle);

    // ==========================================
    // 2. CONDITION EXTRACTION
    // ==========================================
    if (/\bNEW\b/.test(title)) data.condition = "N";
    else if (/\b(EXCELLENT|EXC)\b/.test(title)) data.condition = "E";
    else if (/\bGOOD\b/.test(title)) data.condition = "G";
    else if (/\b(PREMIUM|PREM)\b/.test(title)) data.condition = "P";
    else if (/\b(FAIR|B-GRADE|B GRADE)\b/.test(title)) data.condition = "B";

    // ==========================================
    // 3. RAM & STORAGE EXTRACTION
    // ==========================================
    const ramMatch = title.match(/\b(\d+)\s*(?:GB|TB)?\s*RAM\b/);
    if (ramMatch) data.ram = ramMatch[1];

    // Handles storage even if "GB" is omitted (e.g., "512 SSD")
    const storageMatch = title.match(/\b(\d+)\s*(?:GB|TB)?\s*(?:SSD|HDD|NVME|FLASH)\b/);
    if (storageMatch) data.storage = storageMatch[1];
    
    // Check if it's a TB drive
    if (/\b([1-8])\s*TB\s*(?:SSD|HDD|NVME)\b/.test(title)) {
        data.storage = title.match(/\b([1-8])\s*TB\b/)[1] + "TB";
    }

    // ==========================================
    // 4. APPLE DEVICES (MACBOOKS, IMACS, IPADS)
    // ==========================================
    if (title.includes("MACBOOK")) {
        let isAir = title.includes("AIR");
        let prefix = isAir ? "MA" : "MP";
        let yearMatch = title.match(/20(\d{2})/);
        let year = yearMatch ? yearMatch[1] : "XX";
        let sizeMatch = title.match(/(\d{2})["']/);
        let size = sizeMatch ? sizeMatch[1] : "";
        data.base = `LP-${prefix}${year}${size ? '-' + size : ''}`;
        return data; 
    }

    if (title.includes("IMAC")) {
        let yearMatch = title.match(/20(\d{2})/);
        let year = yearMatch ? yearMatch[1] : "XX";
        let sizeMatch = title.match(/(\d{2})["']/);
        let size = sizeMatch ? sizeMatch[1] : "";
        let res = title.includes("5K") ? "-5K" : (title.includes("4K") ? "-4K" : "");
        data.base = `D-IMAC${year}-${size}${res}`;
        return data;
    }

    if (title.includes("IPAD")) {
        let isPro = title.includes("PRO");
        let sizeMatch = title.match(/(12\.9|11|10\.5|10\.9|9\.7)/);
        let size = sizeMatch ? sizeMatch[1] : "";
        let genMatch = title.match(/(\d+)(?:TH|RD|ND|ST)?\s*GEN/);
        let gen = genMatch ? genMatch[1] : "";
        
        // Handle specific iPad generations like "iPad 5"
        if (!isPro && !size && !genMatch) {
            let directGen = title.match(/IPAD\s*(\d)/);
            if (directGen) gen = directGen[1];
        }
        
        data.base = `TB-IPAD${isPro ? 'PRO' : ''}${size}${gen}`;
        if (title.includes("LTE") || title.includes("CELLULAR")) data.features.push("LTE");
        return data;
    }

    // ==========================================
    // 5. PROCESSORS (CPU)
    // ==========================================
    let isDesktop = /\b(DESKTOP|TOWER|SFF|MICRO|AIO|MINI|OPTIPLEX|PRODESK|ELITEDESK|THINKCENTRE)\b/.test(title);
    
    // Intel Core Ultra
    let ultraMatch = title.match(/ULTRA\s*(\d)\s*([\w\d]+)/);
    // Intel Core i3/i5/i7/i9
    let intelMatch = title.match(/I([3579])\s*[-]?\s*(\d{4,5}[A-Z]*)/);
    // Xeon
    let xeonMatch = title.match(/XEON\s+(?:SILVER|GOLD|BRONZE|PLATINUM|W)?\s*(\d{4})/);
    // Celeron
    let celeronMatch = title.match(/\b(N\d{4})\b/);

    if (ultraMatch) {
        data.cpu = `Ultra${ultraMatch[1]}${ultraMatch[2].toLowerCase()}`;
    } else if (intelMatch) {
        let tier = intelMatch[1];
        let fullNum = intelMatch[2];
        
        if (isDesktop && !title.includes("NUC")) {
            // Desktops keep full string (e.g., i79700T)
            data.cpu = `i${tier}${fullNum}`;
        } else {
            // Laptops calculate generation
            let firstTwo = parseInt(fullNum.substring(0, 2));
            let gen = (firstTwo >= 10 && firstTwo <= 14) ? firstTwo : fullNum.substring(0, 1);
            data.cpu = `i${tier}${gen}TH`;
        }
    } else if (xeonMatch) {
        data.cpu = xeonMatch[1];
    } else if (celeronMatch) {
        data.cpu = celeronMatch[1];
    }

    // ==========================================
    // 6. MODEL BASE & CATEGORIZATION
    // ==========================================
    let isTouch = title.includes("TOUCH");
    
    // INTEL NUC (Forces Desktop)
    let nucMatch = title.match(/NUC\w+/);
    if (nucMatch) {
        data.base = `D-${nucMatch[0]}`;
        isDesktop = true;
    }
    // MICROSOFT SURFACE
    else if (title.includes("SURFACE LAPTOP")) {
        let gen = title.match(/SURFACE LAPTOP\s*(\d+)/);
        data.base = `LP-MSL${gen ? gen[1] : ''}`;
    } else if (title.includes("SURFACE PRO")) {
        let gen = title.match(/SURFACE PRO\s*(\d+)/);
        data.base = `LP-MSP${gen ? gen[1] : ''}`;
    } else if (title.includes("SURFACE BOOK")) {
        let gen = title.match(/SURFACE BOOK\s*(\d+)/);
        data.base = `LP-MSB${gen ? gen[1] : ''}`;
    }
    // HP ZBOOK STANDARDIZER
    else if (title.includes("ZBOOK")) {
        let sizeMatch = title.match(/ZBOOK(?:\s*POWER|\s*FIREFLY|\s*STUDIO|\s*FURY)?\s*(\d{2})?/);
        let size = (sizeMatch && sizeMatch[1]) ? sizeMatch[1] : "";
        let genMatch = title.match(/G(\d+)/);
        let gen = genMatch ? `G${genMatch[1]}` : "";
        data.base = `LP-Zbook${size}${gen}`;
    }
    // HP ELITE X2
    else if (title.includes("ELITE X2") || title.includes("PRO X2")) {
        let genMatch = title.match(/G(\d+)/);
        let gen = genMatch ? `g${genMatch[1]}` : "";
        data.base = `LP-x2${gen}`;
        isTouch = false; // Bypass 'T' modifier for X2 devices
    }
    // HP ELITEBOOK / PROBOOK
    else if (title.match(/(?:ELITEBOOK|PROBOOK)\s*(\d{3})\s*G(\d+)/)) {
        let m = title.match(/(?:ELITEBOOK|PROBOOK)\s*(\d{3})\s*G(\d+)/);
        data.base = `LP-${m[1]}G${m[2]}`;
    }
    // LENOVO THINKPAD
    else if (title.match(/THINKPAD\s*([A-Z]\d{2})\s*G(\d+)/)) {
        let m = title.match(/THINKPAD\s*([A-Z]\d{2})\s*G(\d+)/);
        data.base = `LP-${m[1]}G${m[2]}`;
    } else if (title.includes("X1 CARBON")) {
        let gen = title.match(/G(?:EN)?\s*(\d+)/);
        data.base = `LP-X1CG${gen ? gen[1] : ''}`;
    } else if (title.includes("X1 YOGA")) {
        let gen = title.match(/G(?:EN)?\s*(\d+)/);
        data.base = `LP-X1YG${gen ? gen[1] : ''}`;
    }
    // DELL LATITUDE / PRECISION / VOSTRO
    else if (title.match(/(?:LATITUDE|PRECISION|VOSTRO|INSPIRON)\s*(\d{4})/)) {
        let m = title.match(/(?:LATITUDE|PRECISION|VOSTRO|INSPIRON)\s*(\d{4})/);
        data.base = `LP-${m[1]}`;
    }
    // DELL OPTIPLEX (Desktop)
    else if (title.match(/OPTIPLEX\s*(\d{4})/)) {
        let m = title.match(/OPTIPLEX\s*(\d{4})/);
        data.base = `D-${m[1]}`;
        isDesktop = true;
    }
    // ACER TRAVELMATE / SWIFT / SPIN
    else if (title.includes("TRAVELMATE")) {
        let m = title.match(/TRAVELMATE\s*([A-Z0-9-]+)/);
        data.base = `LP-${m ? m[1].replace(/-/g, '') : 'UNKNOWN'}`;
    } else if (title.includes("SWIFT") || title.includes("SPIN")) {
        let m = title.match(/(?:SWIFT|SPIN)\s*(?:[A-Z0-9]+)?\s*([A-Z]{2}\d{3})/);
        data.base = `LP-${m ? m[1] : 'UNKNOWN'}`;
    }
    // TOSHIBA DYNABOOK
    else if (title.includes("PORTEGE") || title.includes("TECRA")) {
        let suffix = title.match(/(?:PORTEGE|TECRA)\s*([A-Z0-9]+-[A-Z0-9]+)/);
        data.base = suffix ? `LP-Portege${suffix[1].replace(/-/g, '')}` : "LP-DynaPor";
    }
    // CATCH-ALL (Raw Model Isolator)
    else {
        data.base = isDesktop ? "D-UNKNOWN" : "LP-UNKNOWN";
    }

    // ==========================================
    // 7. MODIFIERS & FEATURES
    // ==========================================
    
    // Append 'T' for touchscreens directly to the model base
    if (isTouch && !isDesktop) {
        data.base += "T";
    }

    // Desktop Specific Form Factors & Cleanups
    if (isDesktop) {
        if (title.includes("SFF")) data.base += "SFF";
        else if (title.match(/\bM\b|MICRO|MINI/)) data.base += "m";
        else if (title.includes("TC") || title.includes("THIN CLIENT")) data.base += "TC";
        else if (title.includes("AIO")) data.base += (isTouch ? "AIOT" : "AIO");

        // Desktops usually omit RAM/Storage unless it's a Thin Client
        if (!title.includes("TC") && !title.includes("THIN CLIENT")) {
            data.ram = "";
            data.storage = "";
        }
    }

    // Optional Features Block
    if (title.includes("LTE") || title.includes("CELLULAR")) data.features.push("LTE");
    if (title.includes("4K")) data.features.push("4K");
    if (title.includes("QHD")) data.features.push("QHD");
    if (title.includes("2-IN-1") || title.includes("X360")) data.features.push("2in1");
    if (title.includes("HOME")) data.features.push("Home");

    // Dedicated GPUs (Laptops & Desktops)
    let gpuMatch = title.match(/(?:RTX|GTX|QUADRO|RX)\s*([A-Z]?\d+)[A-Z]*/);
    if (gpuMatch) {
        data.features.push(gpuMatch[0].replace(/\s/g, ''));
    }

    // Keyboard manual tags (fallback legacy support)
    if (data.hasNoKb) data.features.push("NOKB");
    else if (data.hasKb) data.features.push("KB");

    return data;
}
