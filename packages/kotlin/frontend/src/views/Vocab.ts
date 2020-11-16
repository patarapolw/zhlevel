import m from "mithril";
import XRegExp from "xregexp";

import InputBar from "../components/InputBar";
import Loader from "../components/Loader";
import getJsonFromUrl, { postJson } from "../utils";

export default (initialVnode: any) => {
    let vocabList: any[] = [];
    let i: number = 0;
    let sentenceList: any[] = [];
    const current: any = {};
    let isLoading = false;
    let isSentenceLoading = false;

    function parseJieba(s: string) {
        if (s.length > 0) {
            isLoading = true;
            postJson("/api/jieba/", { entry: s }).then((res) => {
                const distinctVocabList = res
                    .map((el: any) => el.word)
                    .filter((el: string, _i: number, self: any) => {
                        return XRegExp("\\p{Han}").test(el) && self.indexOf(el) === _i;
                    });

                parseVocab(distinctVocabList);
            });
        }
    }

    function parseVocab(vList: string[]) {
        isLoading = true;
        postJson("/api/vocab/match", { entries: vList }).then((res) => {
            i = 0;
            vocabList = res;
            isLoading = false;
            m.redraw();
        });
    }

    return {
        view() {
            const urlJson = getJsonFromUrl();
            const is = urlJson.is;
            const q = urlJson.q;

            if (is.length > 0 && current.is !== is) {
                parseVocab([is]);
                current.is = is;
            } else if (current.q !== q) {
                parseJieba(q);
                current.q = q;
            }

            let currentVocab = vocabList[i];

            if (currentVocab === undefined) {
                currentVocab = {};
                sentenceList = [];
            } else {
                if (current.simplified !== currentVocab.simplified) {
                    isSentenceLoading = true;
                    postJson("/api/sentence/", { entry: currentVocab.simplified }).then((res) => {
                        sentenceList = res.map((el: any) => {
                            return m(".inline", [
                                m(".zh-contextmenu.sentence", el.chinese),
                                m("div", el.english)
                            ]);
                        });
                        current.simplified = currentVocab.simplified;
                        isSentenceLoading = false;
                        m.redraw();
                    })
                    .catch((e) => {
                        isSentenceLoading = false;
                        m.redraw();
                    });
                }
            }

            return m(".row.mt-3", [
                m(".input-group", [
                    m(InputBar, {
                        parse(s: string) { parseJieba(s); }
                    })
                ]),
                m(".row.mt-3.full-width", [
                    m(".col-md-6.text-center", [
                        m("input.vocab-display.vocab.zh-contextmenu", {
                            onkeypress(e: any) {
                                if (e.keyCode === 13 || e.which === 13 || e.key === "Enter") {
                                    parseVocab([e.target.value]);
                                }
                                e.target.value = e.target.value.split("\n")[0];
                            },
                            value: currentVocab.simplified
                        }),
                        m(".button-prev-next", [
                            m(".btn-group.col-auto", [
                                m("button.btn.btn-info.btn-default", {
                                    disabled: !(i > 0),
                                    onclick(e: any) { i--; m.redraw(); }
                                }, "Previous"),
                                m("button.btn.btn-info.btn-default", {
                                    disabled: !(i < vocabList.length - 1),
                                    onclick(e: any) { i++; m.redraw(); }
                                }, "Next")
                            ])
                        ]),
                        m(".mt-3",
                            m("a", {
                                href:
                                `https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=${
                                    current.q || currentVocab.simplified}`,
                                target: "_blank"
                            }, "Open in MDBG"))
                    ]),
                    m(".col-md-6", [
                        m(".row", m("h4", "Traditional")),
                        m(".row.vocab-list.vocab",
                            isLoading ? m(Loader)
                                : m(".vocab-small-display.zh-contextmenu", currentVocab.traditional || "")),
                        m(".row", m("h4", "Reading")),
                        m(".row.pinyin-list",
                            isLoading ? m(Loader)
                                : m("div", currentVocab.pinyin || "")),
                        m(".row", m("h4", "English")),
                        m(".row.pinyin-list",
                            isLoading ? m(Loader)
                                : m("div", currentVocab.english || "")),
                        m(".row", m("h4", "Sentences")),
                        m(".row.sentence-list",
                            isSentenceLoading ? m(Loader)
                                : sentenceList)
                    ])
                ])
            ]);
        }
    };
};
