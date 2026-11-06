import { ImageResponse } from "next/og";
export const alt = "Your group chat. Finally going somewhere. Escape Match by Easelife.";
export const size = { width:1200,height:630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(<div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"70px",background:"#132140",color:"white"}}><div style={{display:"flex",fontSize:22,letterSpacing:5,color:"#bdcdf3"}}>EASELIFE / ESCAPE MATCH</div><div style={{display:"flex",flexDirection:"column",fontSize:80,lineHeight:1.05,letterSpacing:-4}}><span>Your group chat.</span><span style={{color:"#bdcdf3"}}>Finally going somewhere.</span></div><div style={{display:"flex",fontSize:24,color:"#bdcdf3"}}>Pick privately. Reveal together. Find your escape.</div></div>,size);
}
