import {bl, ul, dl} from "./globals"

export default class Tooltip {
    constructor(t) {
        this.props = t, this.init(), this.now = new Date, this.cardHeader = "", this.units = {
            day: 864e5,
            hour: 36e5,
            minute: 6e4,
            second: 1e3
        }, this.cardOffset = {
            x: 10,
            y: 16
        }
    }
    init() {
        const t = document.querySelector(this.props.parentSelector || "body"),
            {
                basePath: e,
                imagePath: n
            } = bl;
        this.isVisible = false, this.element = function(t, e, n) {
            t = t || "div";
            const i = document.createElement(t);
            return e && e.forEach((t => {
                i.classList.add(t)
            })), n && (i.innerHTML = n), i
        }("div", ["data-info", "position-absolute", "top-0", "left-0", "rounded", "text-mono", "f6", "py-3", "pl-2", "pr-5", "z-3", "js-globe-popup", "text-white", "d-none"], `\n      <a class='js-globe-popover-card no-underline d-flex flex-row flex-items-start'>\n\n        <div class='pr-2 pt-1 pl-2'>\n          <img src='${e}${n}pull-request-icon.svg' aria-hidden='true' class='js-globe-popup-icon-pr' loading='lazy'>\n          <img src='${e}${n}north-star.svg' aria-hidden='true' class='js-globe-popup-icon-acv mt-n1 d-none' width='24' loading='lazy'>\n        </div>\n\n        <div>\n          <div class='f4 text-white js-globe-popover-header'>#34234 facebook/react</div>\n          <div style='color: #959da5' class='js-globe-popover-body'></div>\n        </div>\n\n      </a>\n    `), this.element.style.maxWidth = "450px", this.element.style.backgroundColor = "rgba(0,0,0, 0.4)", this.element.style.backdropFilter = "blur(10px)", this.element.style.webkitBackdropFilter = "blur(10px)", t.appendChild(this.element), this.card = this.element.querySelector(".js-globe-popover-card"), this.header = this.card.querySelector(".js-globe-popover-header"), this.body = this.card.querySelector(".js-globe-popover-body")
    }
    update(t, e) {
        const n = t.x + e.x + this.cardOffset.x,
            i = t.y + e.y + this.cardOffset.y,
            r = this.element.getBoundingClientRect(),
            s = Math.min(n, window.innerWidth - r.width - this.cardOffset.x),
            o = i + r.height,
            c = t.y - r.height - this.cardOffset.y / 2 + e.y,
            h = o > window.innerHeight + e.y ? c : i;
        this.element.style.transform = `translate(${s}px, ${h}px)`
    }
    setInfo(t) {
        const {
            user_opened_location: e,
            user_merged_location: n,
            language: i,
            type: r,
            header: s,
            body: o,
            name_with_owner: c,
            pr_id: h,
            time: u,
            url: d
        } = t, f = `#${h} ${c}`;
        if (this.cardHeader == f || this.cardHeader == s) return;
        this.cardHeader = f;
        const m = this.shouldShowTime(u) ? this.relativeTime(u) : "";
        null !== d && (this.card.href = d), r === dl ? (this.header.textContent = f, this.body.innerText = `Opened in ${e},\nmerged ${m} in ${n}`, null !== i && this.body.prepend(i, this.colorDotForLanguage(i)), this.showPRIcon()) : r === ul ? (this.header.textContent = f, this.body.innerText = `Opened ${m} in ${e}`, null !== i && this.body.prepend(i, this.colorDotForLanguage(i)), this.showPRIcon()) : r === pl && (this.header.textContent = s, this.body.innerText = o, this.showGHIcon())
    }
    relativeTime(t) {
        const e = t - this.now;
        for (const n in this.units)
            if (Math.abs(e) > this.units[n] || "second" == n) {
                const t = Math.abs(Math.round(e / this.units[n]));
                return `${t} ${n}${t>1?"s":""} ago`
            }
    }
    shouldShowTime(t) {
        return null !== t && this.now - t < this.units.day
    }
    showPRIcon() {
        document.querySelector(".js-globe-popup-icon-pr").classList.remove("d-none"), document.querySelector(".js-globe-popup-icon-acv").classList.add("d-none")
    }
    showGHIcon() {
        document.querySelector(".js-globe-popup-icon-pr").classList.add("d-none"), document.querySelector(".js-globe-popup-icon-acv").classList.remove("d-none")
    }
    show() {
        if (1 == this.isVisible) return;
        const {
            domElement: t,
            controls: e
        } = this.props;
        t.classList.add("cursor-pointer"), this.element.classList.remove("d-none"), this.element.classList.add("d-block"), e.autoRotationSpeedScalarTarget = 0, this.isVisible = true
    }
    hide() {
        if (0 == this.isVisible) return;
        const {
            domElement: t,
            controls: e
        } = this.props;
        t.classList.remove("cursor-pointer"), this.element.classList.remove("d-block"), this.element.classList.add("d-none"), e.autoRotationSpeedScalarTarget = 1, this.isVisible = false
    }
    dispose() {
        this.element && this.element.parentNode && document.body.removeChild(this.element), this.element = null, this.props = null, this.icon = null, this.dataElement = null, this.openedLocationElement = null, this.mergedLocationElement = null, this.languageElement = null
    }
    colorDotForLanguage(t) {
        const e = document.createElement("span");
        return e.style.color = this.colorForLanguage(t), e.textContent = " â€¢ ", e
    }
    colorForLanguage(t) {
        return {
            ActionScript: "#882B0F",
            AMPL: "#E6EFBB",
            "API Blueprint": "#2ACCA8",
            "Apollo Guidance Computer": "#0B3D91",
            AppleScript: "#101F1F",
            Arc: "#aa2afe",
            "ASP.NET": "#9400ff",
            Assembly: "#6E4C13",
            Batchfile: "#C1F12E",
            C: "#555555",
            "C#": "#178600",
            "C++": "#f34b7d",
            Clojure: "#db5855",
            CoffeeScript: "#244776",
            ColdFusion: "#ed2cd6",
            "ColdFusion CFC": "#ed2cd6",
            "Common Lisp": "#3fb68b",
            "Component Pascal": "#B0CE4E",
            Crystal: "#000100",
            CSON: "#244776",
            CSS: "#563d7c",
            Dart: "#00B4AB",
            Dockerfile: "#384d54",
            EJS: "#a91e50",
            Elixir: "#6e4a7e",
            Elm: "#60B5CC",
            "Emacs Lisp": "#c065db",
            EmberScript: "#FFF4F3",
            EQ: "#a78649",
            Erlang: "#B83998",
            "Game Maker Language": "#71b417",
            GAML: "#FFC766",
            Glyph: "#c1ac7f",
            Go: "#00ADD8",
            GraphQL: "#e10098",
            Haml: "#ece2a9",
            Handlebars: "#f7931e",
            Harbour: "#0e60e3",
            Haskell: "#5e5086",
            HTML: "#e34c26",
            J: "#9EEDFF",
            Java: "#b07219",
            JavaScript: "#f1e05a",
            Julia: "#a270ba",
            Kotlin: "#F18E33",
            Less: "#1d365d",
            Lex: "#DBCA00",
            LLVM: "#185619",
            Lua: "#000080",
            Makefile: "#427819",
            Markdown: "#083fa1",
            MATLAB: "#e16737",
            Mercury: "#ff2b2b",
            Metal: "#8f14e9",
            Nim: "#ffc200",
            Nix: "#7e7eff",
            NumPy: "#9C8AF9",
            "Objective-C": "#438eff",
            "Objective-C++": "#6866fb",
            Pan: "#cc0000",
            Pascal: "#E3F171",
            Pawn: "#dbb284",
            Perl: "#0298c3",
            PHP: "#4F5D95",
            PLSQL: "#dad8d8",
            PostScript: "#da291c",
            PowerBuilder: "#8f0f8d",
            PowerShell: "#012456",
            Prisma: "#0c344b",
            Processing: "#0096D8",
            Puppet: "#302B6D",
            Python: "#3572A5",
            R: "#198CE7",
            Reason: "#ff5847",
            Ruby: "#701516",
            Rust: "#dea584",
            Sass: "#a53b70",
            Scala: "#c22d40",
            Scheme: "#1e4aec",
            SCSS: "#c6538c",
            Shell: "#89e051",
            Svelte: "#ff3e00",
            SVG: "#ff9900",
            Swift: "#ffac45",
            "TI Program": "#A0AA87",
            Turing: "#cf142b",
            Twig: "#c1d026",
            TypeScript: "#2b7489",
            Uno: "#9933cc",
            UnrealScript: "#a54c4d",
            Vala: "#fbe5cd",
            "Vim script": "#199f4b",
            "Visual Basic .NET": "#945db7",
            Vue: "#41586f",
            wdl: "#42f1f4",
            WebAssembly: "#04133b",
            YAML: "#cb171e"
        } [t]
    }
}
