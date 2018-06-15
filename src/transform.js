const {
  JSXParserVisitor
} = require('./parser/JSXParserVisitor');
const { JSXLexer } = require('./parser/JSXLexer');
const { JSXParser } = require('./parser/JSXParser');
const antlr = require('antlr4/index');
const TAG_NAME_REG = /^<\s*(.+)/;
const LOWER_LETTER_REG = /^[a-z]/;
class JSXTransformVisitor extends JSXParserVisitor {
  _ce(tag, props = '', children = '') {
    const m = tag.match(TAG_NAME_REG);
    const tagName = m[1];
    return `React.createElement(${
      LOWER_LETTER_REG.test(tagName) ? `'${tagName}'` : tagName
    }, ${
      props ? props : 'null'
    }${
      children ? `, ${children}` : ''
    })`;
  }
  visitChildren(ctx) {
    return super.visitChildren(ctx).join('');
  }
  visitJs(ctx) {
    return ctx.JS().getText();
  }
  visitBlockJsx(ctx) {
    return ctx.LP().getText() + this.visit(ctx.jsx()) + ctx.RP().getText();
  }
  visitHtmlChardata(ctx) {
    return JSON.stringify((ctx.HTML_WS() || ctx.HTML_TEXT()).getText().trim());
  }
  visitHtmlContent(ctx) {
    return super.visitChildren(ctx)
      .filter(child => !!child && child !== '""')
      .join(',');
  }
  visitHtmlContentJsx(ctx) {
    return this.visit(ctx.jsx());
  }
  visitHtmlWithChildren(ctx) {
    const tag = (ctx.HTML_TAG_OPEN() || ctx.TAG_OPEN()).getText();
    const attrs = this.visit(ctx.htmlAttributes());
    const children = this.visit(ctx.htmlContent());
    return this._ce(tag, attrs, children);
  }
  visitHtmlNoChildren(ctx) {
    const tag = (ctx.HTML_TAG_OPEN() || ctx.TAG_OPEN()).getText();
    const attrs = this.visit(ctx.htmlAttributes());
    return this._ce(tag, attrs);
  }
  visitHtmlAttributes(ctx) {
    if (!ctx.children) return '';
    const attrs = super.visitChildren(ctx);
    return attrs.length === 0 ? '' : ('{\n' + attrs.join(',\n') + '\n}');
  }
  visitHtmlAttribute(ctx) {
    const name = ctx.TAG_NAME().getText();
    const hasVal = !!ctx.TAG_EQUALS();
    if (!hasVal) {
      return `${name}: true`;
    }
    const val = ctx.TAG_VALUE();
    if (val) {
      return `${name}: ${val}`;
    }
    const jsx = this.visit(ctx.jsx());
    return `${name}: ${jsx.trim()}`;
  }
}
module.exports = function transform(content, map, meta) {
  const lexer = new JSXLexer(new antlr.InputStream(content));
  const tokens = new antlr.CommonTokenStream(lexer);
  const parser = new JSXParser(tokens);
  const visitor = new JSXTransformVisitor();
  return visitor.visit(parser.jsx());
}