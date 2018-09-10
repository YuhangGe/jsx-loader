const {
  JSXParserVisitor
} = require('./parser/JSXParserVisitor');
const { JSXLexer } = require('./parser/JSXLexer');
const { JSXParser } = require('./parser/JSXParser');
const antlr = require('antlr4/index');
const TAG_NAME_REG = /^<\s*(.+)/;
const LOWER_LETTER_REG = /^[a-z]/;
const { encode } = require('sourcemap-codec');


class JSXTransformVisitor extends JSXParserVisitor {
  constructor() {
    super();
    this.__column = 0;
    this.__lines = [
      []
    ];
  }
  visitChildren(ctx, joinSep = '') {
    if (!ctx.children) return '';
    const sepLen = joinSep.length;
    const cs = [];
    ctx.children.forEach((child, idx) => {
      const backupColumn = this.__column;
      if (idx > 0) this.__column += sepLen;
      const cnt = child.accept(this);
      if (!!cnt) {
        cs.push(cnt);
      } else if (idx > 0) {
        this.__column = backupColumn;
      }
    });
    return cs.join(joinSep);
  }
  _leftTrim(line) {
    const m = line.match(/^\s+/);
    if (!m) return 0;
    return m[0].length;
  }
  visitJs(ctx) {
    const n = ctx.JS();
    const t = n.getText();
    if (t === '') return t;
    const ls = t.split(/\r?\n/);
    // console.log(n.symbol.line, ls.length, n.symbol.column, '==>', this.__lines.length);

    // console.log(JSON.stringify(t), '\n========\n');
    const org_l = n.symbol.line - 1;
    const l0 = this._leftTrim(ls[0])
    if (ls[0].length > 0 && l0 < ls[0].length) {
      this.__lines[this.__lines.length - 1].push([
        this.__column + l0, 0, org_l, n.symbol.column + l0
      ]);
      this.__column += ls[0].length;
    }
    
    for(let i = 1; i < ls.length; i++) {
      const li = this._leftTrim(ls[i]);
      if (ls[i].length > 0 && li < ls[i].length) {
        this.__lines.push([ [
          li, 0, org_l + i, li
        ] ]);
      } else {
        this.__lines.push([]);
      }
      this.__column = ls[i].length;
    }
    // console.log(this.__lc);
    return t;
  }
  visitBlockJsx(ctx) {
    const lp = ctx.LP().getText();
    this.__column++;
    const block = this.visit(ctx.jsx());
    const rp = ctx.RP().getText();
    this.__column++;
    return lp + block + rp;
  }
  visitHtmlChardata(ctx) {
    const t = (ctx.HTML_WS() || ctx.HTML_TEXT()).getText().trim();
    if (!t) return '';
    const d = JSON.stringify(t);
    this.__column += d.length;
    return d;
  }
  visitHtmlContent(ctx) {
    if (!ctx.children) return '';
    return this.visitChildren(ctx, ',');
  }
  visitHtmlContentJsx(ctx) {
    return this.visit(ctx.jsx());
  }
  visitHtmlWithChildren(ctx) {
    const tag = (ctx.HTML_TAG_OPEN() || ctx.TAG_OPEN()).getText();
    const m = tag.match(TAG_NAME_REG);
    const tagName = m[1];
    const lp = `React.createElement(${LOWER_LETTER_REG.test(tagName) ? `'${tagName}'` : tagName}, `;
    this.__column += lp.length;
    const attrs = this.visit(ctx.htmlAttributes());
    if (!attrs) {
      this.__column += 4; // "null"
    }
    const backupColumn = this.__column;
    this.__column += 2; // ", "
    const children = this.visit(ctx.htmlContent());
    if (!children) {
      this.__column = backupColumn;
    }
    this.__column++; // ")"
    return lp + (attrs ? attrs : 'null') + (children ? `, ${children}` : '') + ')';
  }
  visitHtmlNoChildren(ctx) {
    const tag = (ctx.HTML_TAG_OPEN() || ctx.TAG_OPEN()).getText();
    const m = tag.match(TAG_NAME_REG);
    const tagName = m[1];
    const lp = `React.createElement(${LOWER_LETTER_REG.test(tagName) ? `'${tagName}'` : tagName}, `;
    this.__column += lp.length;
    const attrs = this.visit(ctx.htmlAttributes());
    if (attrs) {
      this.__column++;
      return lp + attrs + ')';
    } else {
      this.__column += 5;
      return lp + 'null)'
    }
  }
  visitHtmlAttributes(ctx) {
    if (!ctx.children) return '';
   
    const backupColumn = this.__column;
    const lp = '{';
    this.__column++;
    const attrs = this.visitChildren(ctx, ',');
    if (attrs.length === 0) {
      this.__column = backupColumn;
      return '';
    }
    const rp = '}';
    this.__column++;
    return lp + attrs + rp;
  }
  visitHtmlAttribute(ctx) {
    const name = ctx.TAG_NAME().getText();
    const hasVal = !!ctx.TAG_EQUALS();
    if (!hasVal) {
      const cnt = `${name}: true`;
      this.__column += cnt.length;
      return cnt;
    }
    const val = ctx.TAG_VALUE();
    if (val) {
      const cnt = `${name}: ${val}`;
      this.__column += cnt.length;
      return cnt;
    }
    const lp = `${name}: `;
    this.__column += lp.length;
    return lp + this.visit(ctx.jsx());
  }
}

const EMPTY = {code: '', map: null};

module.exports = function transform(content, map, meta) {
  if (content.length === 0) return EMPTY;

  const lexer = new JSXLexer(new antlr.InputStream(content));
  const tokens = new antlr.CommonTokenStream(lexer);
  const parser = new JSXParser(tokens);
  const visitor = new JSXTransformVisitor();
  const code = visitor.visit(parser.jsx());
  const mappings = encode(visitor.__lines);
  // console.log(visitor.__lines);
  // console.log(mappings);
  return {
    code,
    map: {
      mappings
    }
  };
}