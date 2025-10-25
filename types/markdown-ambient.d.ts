// Ambient module declarations to keep TS happy before deps are installed.
// These will be superseded by real types once packages are installed.
declare module "react-markdown" {
  const ReactMarkdown: any
  export default ReactMarkdown
}

declare module "remark-gfm" {
  const gfm: any
  export default gfm
}
