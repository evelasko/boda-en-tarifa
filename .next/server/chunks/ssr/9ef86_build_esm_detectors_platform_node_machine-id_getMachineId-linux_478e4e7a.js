;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="71e1dda4-7420-5c9a-44cc-ecd2299c016f")}catch(e){}}();
module.exports=[36860,a=>{"use strict";var b=a.i(22734),c=a.i(84151);async function d(){for(let a of["/etc/machine-id","/var/lib/dbus/machine-id"])try{return(await b.promises.readFile(a,{encoding:"utf8"})).trim()}catch(a){c.diag.debug(`error reading machine id: ${a}`)}}a.s(["getMachineId",()=>d])}];

//# debugId=71e1dda4-7420-5c9a-44cc-ecd2299c016f
//# sourceMappingURL=9ef86_build_esm_detectors_platform_node_machine-id_getMachineId-linux_478e4e7a.js.map