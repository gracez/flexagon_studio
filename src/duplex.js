// In landscape, a short-edge duplex flip mirrors the back sheet across its
// width when it is viewed from the front. `horizontal` and `vertical` are the
// measured visible back offsets: right/down are positive. The returned point
// is the location to print on the back PDF to cancel that measured offset.
export function shortEdgeBackPoint([x,y],pageWidth,{horizontal=0,vertical=0}={}){
 return [pageWidth-x+horizontal,y-vertical];
}

