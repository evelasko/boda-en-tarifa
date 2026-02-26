;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="ddc3c514-0d34-ae57-bfd0-2613587e86a8")}catch(e){}}();
(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,80561,(e,r,t)=>{"use strict";function n(){return null}Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"default",{enumerable:!0,get:function(){return n}}),("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),r.exports=t.default)},49999,e=>{"use strict";var r=e.i(50789),t=e.i(80561),n=e.i(5778),o=e.i(31945);async function s(){let e=(0,n.getClient)();if(!e)return"no-client-active";if(!e.getDsn())return"no-dsn-configured";try{await (0,o.suppressTracing)(()=>fetch("https://o447951.ingest.sentry.io/api/4509632503087104/envelope/?sentry_version=7&sentry_key=c1dfb07d783ad5325c245c1fd3725390&sentry_client=sentry.javascript.browser%2F1.33.7",{body:"{}",method:"POST",mode:"cors",credentials:"omit"}))}catch{return"sentry-unreachable"}}var a=e.i(30334),i=e.i(29715);class l extends Error{constructor(e){super(e),this.name="SentryExampleFrontendError"}}function c(){let[e,n]=(0,i.useState)(!1),[o,c]=(0,i.useState)(!0);return(0,i.useEffect)(()=>{!async function(){c("sentry-unreachable"!==await s())}()},[]),(0,r.jsxs)("div",{children:[(0,r.jsxs)(t.default,{children:[(0,r.jsx)("title",{children:"sentry-example-page"}),(0,r.jsx)("meta",{name:"description",content:"Test Sentry for your Next.js app!"})]}),(0,r.jsxs)("main",{children:[(0,r.jsx)("div",{className:"flex-spacer"}),(0,r.jsx)("svg",{height:"40",width:"40",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:(0,r.jsx)("path",{d:"M21.85 2.995a3.698 3.698 0 0 1 1.353 1.354l16.303 28.278a3.703 3.703 0 0 1-1.354 5.053 3.694 3.694 0 0 1-1.848.496h-3.828a31.149 31.149 0 0 0 0-3.09h3.815a.61.61 0 0 0 .537-.917L20.523 5.893a.61.61 0 0 0-1.057 0l-3.739 6.494a28.948 28.948 0 0 1 9.63 10.453 28.988 28.988 0 0 1 3.499 13.78v1.542h-9.852v-1.544a19.106 19.106 0 0 0-2.182-8.85 19.08 19.08 0 0 0-6.032-6.829l-1.85 3.208a15.377 15.377 0 0 1 6.382 12.484v1.542H3.696A3.694 3.694 0 0 1 0 34.473c0-.648.17-1.286.494-1.849l2.33-4.074a8.562 8.562 0 0 1 2.689 1.536L3.158 34.17a.611.611 0 0 0 .538.917h8.448a12.481 12.481 0 0 0-6.037-9.09l-1.344-.772 4.908-8.545 1.344.77a22.16 22.16 0 0 1 7.705 7.444 22.193 22.193 0 0 1 3.316 10.193h3.699a25.892 25.892 0 0 0-3.811-12.033 25.856 25.856 0 0 0-9.046-8.796l-1.344-.772 5.269-9.136a3.698 3.698 0 0 1 3.2-1.849c.648 0 1.285.17 1.847.495Z",fill:"currentcolor"})}),(0,r.jsx)("h1",{children:"sentry-example-page"}),(0,r.jsxs)("p",{className:"description",children:["Click the button below, and view the sample error on the Sentry ",(0,r.jsx)("a",{target:"_blank",href:"https://misfitcoders.sentry.io/issues/?project=4510472752005120",children:"Issues Page"}),". For more details about setting up Sentry, ",(0,r.jsx)("a",{target:"_blank",href:"https://docs.sentry.io/platforms/javascript/guides/nextjs/",children:"read our docs"}),"."]}),(0,r.jsx)("button",{type:"button",onClick:async()=>{throw await a.startSpan({name:"Example Frontend/Backend Span",op:"test"},async()=>{(await fetch("/api/sentry-example-api")).ok||n(!0)}),new l("This error is raised on the frontend of the example page.")},disabled:!o,children:(0,r.jsx)("span",{children:"Throw Sample Error"})}),e?(0,r.jsx)("p",{className:"success",children:"Error sent to Sentry."}):o?(0,r.jsx)("div",{className:"success_placeholder"}):(0,r.jsx)("div",{className:"connectivity-error",children:(0,r.jsx)("p",{children:"It looks like network requests to Sentry are being blocked, which will prevent errors from being captured. Try disabling your ad-blocker to complete the test."})}),(0,r.jsx)("div",{className:"flex-spacer"})]}),(0,r.jsx)("style",{children:`
        main {
          display: flex;
          min-height: 100vh;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 16px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
        }

        h1 {
          padding: 0px 4px;
          border-radius: 4px;
          background-color: rgba(24, 20, 35, 0.03);
          font-family: monospace;
          font-size: 20px;
          line-height: 1.2;
        }

        p {
          margin: 0;
          font-size: 20px;
        }

        a {
          color: #6341F0;
          text-decoration: underline;
          cursor: pointer;

          @media (prefers-color-scheme: dark) {
            color: #B3A1FF;
          }
        }

        button {
          border-radius: 8px;
          color: white;
          cursor: pointer;
          background-color: #553DB8;
          border: none;
          padding: 0;
          margin-top: 4px;

          & > span {
            display: inline-block;
            padding: 12px 16px;
            border-radius: inherit;
            font-size: 20px;
            font-weight: bold;
            line-height: 1;
            background-color: #7553FF;
            border: 1px solid #553DB8;
            transform: translateY(-4px);
          }

          &:hover > span {
            transform: translateY(-8px);
          }

          &:active > span {
            transform: translateY(0);
          }

          &:disabled {
	            cursor: not-allowed;
	            opacity: 0.6;
	
	            & > span {
	              transform: translateY(0);
	              border: none
	            }
	          }
        }

        .description {
          text-align: center;
          color: #6E6C75;
          max-width: 500px;
          line-height: 1.5;
          font-size: 20px;

          @media (prefers-color-scheme: dark) {
            color: #A49FB5;
          }
        }

        .flex-spacer {
          flex: 1;
        }

        .success {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 20px;
          line-height: 1;
          background-color: #00F261;
          border: 1px solid #00BF4D;
          color: #181423;
        }

        .success_placeholder {
          height: 46px;
        }

        .connectivity-error {
          padding: 12px 16px;
          background-color: #E50045;
          border-radius: 8px;
          width: 500px;
          color: #FFFFFF;
          border: 1px solid #A80033;
          text-align: center;
          margin: 0;
        }
        
        .connectivity-error a {
          color: #FFFFFF;
          text-decoration: underline;
        }
      `})]})}e.s(["default",()=>c],49999)}]);

//# debugId=ddc3c514-0d34-ae57-bfd0-2613587e86a8
//# sourceMappingURL=f9cf3899ef851609.js.map