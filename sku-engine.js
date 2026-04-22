// sku-engine.js
// Centralized Business Logic for SKU Generation

function parseTitle(rawText) {
    const title = rawText.toUpperCase();
    
    // --- 1. CATEGORY ---
    let cat = "LP-";
    if (/\b(IPAD|TAB)\b/.test(title)) cat = "TB-";
    else if (/\b(DESKTOP|AIO|WORKSTATION|THIN CLIENT|MINI|IMAC|MAC MINI|TOWER|SFF|MICRO|M710S|NUC)\b/.test(title) && !title.includes("ZBOOK")) cat = "D-";
    else if (/\b(MONITOR|DISPLAY)\b/.test(title)) cat = "M-";
    else if (/\b(HDD|HARD DRIVE|SSD|SAS)\b/.test(title) && /\bHEALTH\b/.test(title)) cat = "ST-";
    else if (/\b(GRAPHICS CARD|GPU)\b/.test(title) && !title.includes("LAPTOP") && !title.includes("DESKTOP")) cat = "Misc-";
    else if (/\b(DOCK|DOCKING)\b/.test(title)) cat = "DS-";
    else if (/\b(CHARGER|ADAPTER)\b/.test(title)) cat = "LC-";

    // --- 2. RAM & STORAGE ---
    const ramMatch = title.match(/\b(\d+)\s*GB\s*(?:RAM|MEMORY)?/);
    let ram = ramMatch ? ramMatch[1] : "";

    let storage = "";
    const storageMatch = title.match(/\b(\d+)\s*(GB|TB)?\s*(SSD|HDD|NVME|EMMC)/);
    if (storageMatch) {
        let unit = storageMatch[2];
        let num = storageMatch[1];
        if (!unit) unit = (num === "1" || num === "2") ? "TB" : "GB";
        storage = unit === "TB" ? num + "TB" : num;
    } else {
        const allGbMatches = [...title.matchAll(/\b(\d+)\s*(GB|TB)\b/g)];
        if (allGbMatches.length > 1) {
            storage = allGbMatches[1][2] === "TB" ? allGbMatches[1][1] + "TB" : allGbMatches[1][1];
        } else if (allGbMatches.length === 1 && !ramMatch) {
            storage = allGbMatches[0][2] === "TB" ? allGbMatches[0][1] + "TB" : allGbMatches[0][1];
        }
    }

    if (cat === "D-" && !title.includes("IMAC") && !title.includes("THIN CLIENT")) { ram = ""; storage = ""; }
    if (cat === "ST-" || cat === "Misc-" || cat === "M-") { ram = ""; storage = ""; }

    // --- 3. PROCESSOR ---
    let proc = "";
    const intelMatch = title.match(/\b(I[3579])[\s-]*(\d{3,5})([A-Z0-9]{0,2})\b/);
    const ultraMatch = title.match(/\bULTRA\s*([579])\s*(\d{3,4}[A-Z]*)\b/);
    
    if (intelMatch) {
        let cpuType = intelMatch[1].toLowerCase();
        let digits = intelMatch[2];
        let letters = intelMatch[3];
        if (cat === "D-" && !title.includes("IMAC")) proc = cpuType + digits + letters; 
        else {
            let gen = (digits.startsWith("10") || digits.startsWith("11") || digits.startsWith("12") || digits.startsWith("13") || digits.startsWith("14")) 
                      ? digits.substring(0, 2) : digits.substring(0, 1);
            proc = cpuType + gen + "th"; 
        }
    } 
    else if (ultraMatch) proc = "Ultra" + ultraMatch[1] + ultraMatch[2].toLowerCase();
    else if (/\bM1 PRO\b/.test(title)) proc = "M1Pro";
    else if (/\bM2 PRO\b/.test(title)) proc = "M2Pro";
    else if (/\bM1\b/.test(title)) proc = "M1";
    else if (/\bM2\b/.test(title)) proc = "M2";
    else if (/RYZEN\s*([3579])/.test(title)) proc = "R" + title.match(/RYZEN\s*([3579])/)[1];
    else if (title.includes("XEON")) {
        const xeonMatch = title.match(/XEON\s*(?:SILVER|GOLD)?\s*(\d{4})/);
        if(xeonMatch) proc = xeonMatch[1];
    } 
    else if (title.match(/\b(N\d{4})\b/)) proc = title.match(/\b(N\d{4})\b/)[1];
    else if (title.match(/\b(I[3579])\b/)) proc = title.match(/\b(I[3579])\b/)[1].toLowerCase();

    if (cat === "TB-") {
        if (/\b(CELLULAR|LTE)\b/.test(title)) proc = "cellular";
        else if (/\b(WI-FI|WIFI)\b/.test(title)) proc = "wifi";
    }

    // --- 4. MODEL EXTRACTION ---
    let modelStr = "";
    let featuresArr = [];
    
    if (cat === "TB-") {
        if (title.includes("IPAD PRO")) {
            const sizeMatch = title.match(/(\d+\.?\d*)\"/);
            const genMatch = title.match(/(\d)(?:ST|ND|RD|TH)\s*GEN/);
            modelStr = "iPadPro" + (sizeMatch ? sizeMatch[1] : "");
            if (genMatch && sizeMatch && sizeMatch[1] === "11") modelStr += genMatch[1]; 
        } else if (title.includes("IPAD MINI")) {
            const genMatch = title.match(/MINI\s*(\d)/);
            modelStr = "iPadmini" + (genMatch ? genMatch[1] : "");
        } else if (title.includes("IPAD AIR")) {
            const genMatch = title.match(/AIR\s*(\d)/);
            modelStr = "iPadAir" + (genMatch ? genMatch[1] : "");
        } else {
            const genMatch = title.match(/IPAD\s*(\d)(?:ST|ND|RD|TH)\s*GEN/);
            modelStr = "iPad" + (genMatch ? genMatch[1] : "");
        }
    } 
    else if (title.includes("MACBOOK")) {
        const yMatch = title.match(/20(\d{2})|20(\d{2})/);
        const sizeMatch = title.match(/(\d{2})\"/);
        modelStr = (title.includes("PRO") ? "MP" : "MA") + (yMatch ? yMatch[1] : "") + (sizeMatch ? "-" + sizeMatch[1] : "");
    }
    else if (title.includes("SURFACE")) {
        const numMatch = title.match(/SURFACE\s+(?:BOOK|LAPTOP|PRO|GO|STUDIO)\s*(\d+)/);
        const gen = numMatch ? numMatch[1] : (title.includes("BOOK 1") ? "1" : "");
        if (title.includes("BOOK")) modelStr = "MSB" + gen;
        else if (title.includes("LAPTOP")) modelStr = "MSL" + gen;
        else if (title.includes("PRO")) modelStr = "MSP" + gen;
        else if (title.includes("GO")) modelStr = "MSG" + gen;
        else if (title.includes("STUDIO")) modelStr = "MSS" + gen;
        else modelStr = "Surface";
    }
    else if (cat === "ST-") {
        const partMatch = title.match(/[A-Z0-9]{8,}/);
        modelStr = partMatch ? partMatch[0] : "DRIVE";
        if (title.match(/100%\s*HEALTH/)) featuresArr.push("100%");
    }
    else if (cat === "Misc-") {
        const gpuMatch = title.match(/(TESLA|QUADRO|RTX|GTX)\s*([A-Z0-9]+)/);
        modelStr = gpuMatch ? (gpuMatch[1] === "TESLA" ? "GPU-Tesla" + gpuMatch[2] : "GPU-" + gpuMatch[2]) : "GPU";
        if (title.includes("LOW PROFILE")) featuresArr.push("LH");
    }
    else if (cat === "M-") {
        const mMatch = title.match(/\b(P|U|E|C)\d{4}[A-Z]{0,2}\b/);
        if (mMatch) modelStr = mMatch[0];
    }
    else if (cat === "D-") {
        if (title.includes("NUC")) {
            const nucMatch = title.match(/\b(NUC[A-Z0-9-]{3,})\b/);
            modelStr = nucMatch ? nucMatch[1].replace(/-/g, "") : "NUC";
        } else if (title.includes("IMAC")) {
            const yMatch = title.match(/20(\d{2})/);
            const sizeMatch = title.match(/(\d{2})\"/);
            modelStr = "iMac" + (yMatch ? yMatch[1] : "") + (sizeMatch ? "-" + sizeMatch[1] : "");
            if (title.includes("5K")) modelStr += "-5K";
        } else {
            if (title.includes("ALIENWARE") || title.includes("AURORA")) {
                const aMatch = title.match(/AURORA\s*(R\d+)/);
                modelStr = aMatch ? "AURORA" + aMatch[1] : "ALIENWARE";
            } else {
                const mMatch = title.match(/\b(7080|7490|7090|3000|7820|5000|M710S|M710|M720)\b/);
                if (mMatch) modelStr = mMatch[1];
                else {
                    const dlMatch = title.match(/(?:OPTIPLEX|LATITUDE|PRECISION|VOSTRO|INSPIRON|PAVILION|PRODESK|ELITEDESK)[^\d]*(\d{4}|\d{3})/);
                    if (dlMatch) modelStr = dlMatch[1];
                }
            }
            let ff = "";
            if (/\b(MICRO|MINI|TINY|DM)\b/.test(title)) ff = "m";
            else if (/\bSFF\b/.test(title)) ff = "SFF";
            else if (/\b(THIN CLIENT|TC)\b/.test(title)) ff = "TC";
            else if (/\b(TOWER|TWR)\b/.test(title)) ff = "Twr";
            else if (/\bAIO\b/.test(title)) ff = "AIO";

            if (/\bTOUCH\b/.test(title) && ff === "AIO") modelStr += "AIOT"; 
            else modelStr += ff;
            
            const dGpuMatch = title.match(/(P\d{4}|T\d{4}|RTX\d{4})/);
            if (dGpuMatch) featuresArr.push(dGpuMatch[1]);
        }
    }
    else if (cat === "LP-") {
        if (title.includes("ZBOOK")) {
            const zMatch = title.match(/ZBOOK\s*(?:POWER\s+|FIREFLY\s+|STUDIO\s+|FURY\s+)?(?:X360\s+)?(?:(\d{2})[A-Z]?)?\s*G(\d+)\b/);
            modelStr = zMatch ? ("Zbook" + (title.includes("FIREFLY") || title.includes("POWER") ? "" : (zMatch[1] || "")) + "G" + zMatch[2]).replace("ZbookZbook", "Zbook") : "Zbook";
            if (modelStr.startsWith("ZbookZB")) modelStr = modelStr.replace("ZbookZB", "ZB");
        } else if (title.includes("ELITE X2") || title.includes("PRO X2")) {
            const mMatch = title.match(/(?:ELITE|PRO)\s*X2\s*G(\d+)/);
            if (mMatch) modelStr = "x2g" + mMatch[1];
        } else if (title.includes("THINKPAD X1 YOGA") || title.includes("THINKPAD X1 CARBON")) {
            const mMatch = title.match(/GEN\s*(\d+)/);
            modelStr = (title.includes("YOGA") ? "X1YG" : "X1CG") + (mMatch ? mMatch[1] : "");
        } else if (title.includes("THINKBOOK")) {
            const mMatch = title.match(/\b(\d{2}S?)(?:\s*G(\d+))?\b/);
            if (mMatch) modelStr = mMatch[1] + (mMatch[2] ? "G" + mMatch[2] : "");
        } else if (title.includes("THINKPAD T14") || title.includes("THINKPAD T15")) {
            const mMatch = title.match(/(T1[45])\s*GEN\s*(\d+)/);
            if (mMatch) modelStr = mMatch[1] + "G" + mMatch[2];
        } else if (title.match(/\b(T|L|P|E)\d{2}\s*GEN\s*(\d+)\b/)) {
            const mMatch = title.match(/\b([TLPE]\d{2})\s*GEN\s*(\d+)\b/);
            modelStr = mMatch[1] + "G" + mMatch[2];
        } else if (title.includes("ELITEBOOK") || title.includes("PROBOOK")) {
            const mMatch = title.match(/(\d{3,4})\s*G(\d+)/); 
            if(mMatch) modelStr = mMatch[1] + "G" + mMatch[2];
        } else if (title.includes("XPS")) {
            const mMatch = title.match(/XPS\s*(\d{4})/);
            modelStr = mMatch ? "XPS" + mMatch[1] : "XPS";
        } else if (title.includes("ENVY") || title.includes("SPECTRE")) {
            const mMatch = title.match(/(ENVY|SPECTRE)\s*(?:X360\s*)?(\d{2})?/);
            if (mMatch) modelStr = mMatch[1] + (mMatch[2] || "");
        } else if (title.includes("TOSHIBA") || title.includes("DYNABOOK") || title.includes("PORTEGE") || title.includes("TECRA")) {
            const tMatch = title.match(/(?:PORTEGE|TECRA)\s+([A-Z0-9]+(?:-[A-Z0-9]+)+)/);
            if (tMatch) modelStr = "Portege" + tMatch[1].replace(/-/g, '');
            else if (title.includes("DYNABOOK PORTEGE")) modelStr = "DynaPor";
            else { const f = title.match(/\b([A-Z0-9]{4,})\b/); if (f) modelStr = f[1]; }
        } else if (title.includes("ACER")) {
            if (title.includes("TRAVELMATE")) {
                const aMatch = title.match(/TRAVELMATE\s+(?:SPIN\s+)?([A-Z0-9]+(?:-[A-Z0-9]+)*)/);
                if (aMatch) modelStr = aMatch[1].replace(/-/g, '');
            } else if (title.includes("SWIFT") || title.includes("SPIN")) {
                const aMatch = title.match(/(?:SF|SP|SPIN)\s*(\d{3,})/);
                if (aMatch) modelStr = title.includes("SWIFT") ? "SF" + aMatch[1] : "SPIN" + aMatch[1];
            } else if (title.includes("ASPIRE")) {
                const aMatch = title.match(/ASPIRE\s*(?:\d\s+)?([A-Z0-9]+(?:-[A-Z0-9]+)*(\s*NITRO)?)/);
                if (aMatch) modelStr = aMatch[1].replace(/[-\s]/g, '');
            } else { const f = title.match(/\b([A-Z0-9]{4,})\b/); if (f) modelStr = f[1]; }
        } else if (title.includes("LATITUDE") || title.includes("PRECISION") || title.includes("VOSTRO") || title.includes("INSPIRON")) {
            const mMatch = title.match(/(?:LATITUDE|PRECISION|VOSTRO|INSPIRON)[^\d]*(\d{4})/);
            if (mMatch) modelStr = mMatch[1];
        } else if (title.match(/\bAY\d{4}[A-Z]+\b/)) {
            modelStr = title.match(/\bAY\d{4}[A-Z]+\b/)[0];
        } else { const f = title.match(/\b([A-Z0-9]{4,})\b/); if (f) modelStr = f[1]; }

        if (/\b(2-IN-1|X360)\b/.test(title) && !modelStr.includes("2in1")) modelStr += "2in1";
        else if (/\bTOUCH\b/.test(title) && !modelStr.endsWith("T") && !modelStr.startsWith("x2g")) modelStr += "T";
        
        if (/\b(LTE|CELLULAR|4G|5G)\b/.test(title)) featuresArr.push("LTE");
        if (/\bQHD\b/.test(title)) featuresArr.push("QHD");
        if (/\b4K\b/.test(title)) featuresArr.push("4K");
        if (/\bWIN 11 H\b|\bHOME\b/.test(title)) featuresArr.push("Home");

        const lGpuMatch = title.match(/\b(RTX\s*[A-Z0-9]+|GTX\s*\d{4}(?:TI|SUPER)?|T\d{3,4}|P\d{4}|A\d{4}|QUADRO\s*[A-Z0-9]+)\b/);
        if (lGpuMatch) featuresArr.push(lGpuMatch[1].replace(/\s+/g, ''));
    }

    // --- 5. COLOR, CONDITION & KEYBOARD ---
    let color = "";
    if (title.includes("SPACE GREY") || title.includes("SPACE GRAY")) color = "SG";
    else if (title.includes("SILVER")) color = "S";
    else if (title.match(/\bGOLD\b/)) color = "G";
    else if (title.includes("PLATINUM")) color = "PLATINUM";

    let condition = ""; 
    if (/\b(#B|FAIR|- B)\b/.test(title)) condition = "B";
    else if (/\b(EXCELLENT|EXC)\b/.test(title)) condition = "E";
    else if (/\bPREMI?UM\b/.test(title)) condition = "P";
    else if (/\b(BRAND NEW|NEW)\b/.test(title)) condition = "N";
    else if (/\b(OPEN BOX|OB)\b/.test(title)) condition = "OB";
    else if (/\bGOOD\b|(-\s*G\b)|(-\s*GOOD\b)/.test(title)) condition = "G";

    let hasNoStandGeneric = title.includes("NO STAND") && cat !== "M-";
    let hasNoStand = title.includes("NO STAND") && cat === "M-";
    let hasBios = title.includes("BIOS");
    let hasNoStylus = title.includes("NO STYLUS");
    let hasNoKb = title.includes("NO KEYBOARD") || title.includes("NO KEYBAORD") || title.includes("W/O KEYBOARD");

    return {
        cat, modelStr, proc, ram, storage, featuresArr, color, condition,
        tags: { hasNoStand, hasNoStandGeneric, hasBios, hasNoStylus, hasNoKb }
    };
}

function buildSkuString(p) {
    let parts = [];
    if (p.modelStr) parts.push(p.modelStr);
    
    if (p.cat === "TB-") {
        if (p.storage) parts.push(p.storage);
        if (p.proc) parts.push(p.proc); 
        if (p.color) parts.push(p.color);
    } else {
        if (p.proc && p.cat !== "Misc-") parts.push(p.proc);
        if (p.ram) parts.push(p.ram); 
        if (p.storage) parts.push(p.storage);
        if (p.featuresArr && p.featuresArr.length > 0) parts.push(p.featuresArr.join("-"));
        if (p.color) parts.push(p.color);
    }

    if (p.tags.hasNoStand) parts.push("NS");
    else if (p.tags.hasNoStandGeneric) parts.push("NOSTAND");
    
    if (p.tags.hasBios) parts.push("BIOS");
    if (p.tags.hasNoStylus) parts.push("NOSTYLUS");
    if (p.condition) parts.push(p.condition);
    if (p.tags.hasNoKb) parts.push("NOKB");

    let finalSku = p.cat + parts.join("-");
    finalSku = finalSku.replace(/10th/ig, "10TH").replace(/11th/ig, "11TH").replace(/12th/ig, "12TH").replace(/13th/ig, "13TH").replace(/14th/ig, "14TH").replace(/8th/ig, "8TH").replace(/9th/ig, "9TH");
    finalSku = finalSku.replace(/-{2,}/g, '-').replace(/-$/, '');
    return finalSku;
}
