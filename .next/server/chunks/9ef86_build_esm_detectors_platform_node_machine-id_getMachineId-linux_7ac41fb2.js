;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="494e64fc-0351-c6a0-f4b7-b3cd6acb07fb")}catch(e){}}();
module.exports=[52013,e=>{"use strict";var i=e.i(22734),r=e.i(43170);async function a(){for(let e of["/etc/machine-id","/var/lib/dbus/machine-id"])try{return(await i.promises.readFile(e,{encoding:"utf8"})).trim()}catch(e){r.diag.debug(`error reading machine id: ${e}`)}}e.s(["getMachineId",()=>a])}];

//# debugId=494e64fc-0351-c6a0-f4b7-b3cd6acb07fb
//# sourceMappingURL=9ef86_build_esm_detectors_platform_node_machine-id_getMachineId-linux_7ac41fb2.js.map