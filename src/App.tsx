import React, { useRef, useState } from 'react';
import './App.css';

interface Picture {
  img: string;
  caption: string;
}

export const App = () => {
  const [pics, setPics] = useState([] as Picture[]);
  const [pgNumStart, setPgNumStart] = useState(undefined as number|undefined);
  const fileInput = useRef(null as HTMLInputElement | null);
  const reader = new FileReader();
  const fileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = fileInput?.current?.files;
    if (!files || !files.length) return;
    const newPics: Picture[] = [];
    for (let i = 0; i < files.length; i++) {
      let prom = resizeImg(files[i]).then((blob: any) =>{
        reader.readAsDataURL(blob);
        return new Promise<Picture>((res, rej) => {
          reader.onload = (evt: ProgressEvent<FileReader>) => {
            if (!evt.target || !evt.target.result) rej();
            res({
              img: evt.target?.result as string,
              caption: files[i].name.slice(0, files[i].name.lastIndexOf('.')),
            });
          };
        });
      });
      newPics.push(await prom);
    }
    newPics.sort((a,b)=> a.caption.localeCompare(b.caption));
    setPics((pics) => {
      pics = pics.concat(newPics);
      return pics;
    });
    fileInput!.current!.value = '';
  };
  const remover = (i: number) => () => {
    setPics(ps => ps.filter((_, i2) => i != i2));
  };
  let quadrants = pics.map((p, i) =>
    <div key={p.caption + i} className='flex-1 flex flex-col min-w-0 items-center justify-center'>
      <div className='print:hidden h-0 text-center z-10'>
        <button className='mt-5 border-2 border-black rounded-full w-8 h-8 text-center text-l bg-white font-bold' onClick={remover(i)}>&#10005;</button>
      </div>
      <div className='p-0.5 min-h-0 flex-shrink justify-center'>
        <img className='max-w-full max-h-full m-auto' src={p.img} />
      </div>
      <div className='text-center'>{p.caption}</div>
    </div>
  );
  let pages: JSX.Element[] = [];
  for(var i=0; i<quadrants.length;) {
    let pg: JSX.Element[] = [];
    for(var r = 0; r<2 && i<quadrants.length; r++) {
      let row: JSX.Element[] = [];
      for(var c = 0; c<2 && i<quadrants.length; c++) {
        row.push(quadrants[i]);
        i++;
      }
      pg.push(<div className='flex flex-row flex-1 min-h-0 items-stretch self-stretch'>{row}</div>)
    }
    pages.push(<div className='page w-full h-screen flex flex-col justify-between'>
      {i <= 4 ? <input type='text' className='text-center font-bold text-3xl' placeholder='Title...' /> : null}
      <div className='flex-1 min-h-0 flex flex-col'>{pg}</div>
      {(i <= 4)
        ? <input type='text' placeholder='Page #' className='text-center' value={pgNumStart} onChange={e=>setPgNumStart(Number.parseInt(e.currentTarget.value)||undefined)} />
        : pgNumStart ? <span className='text-center'>{pgNumStart - 1 + Math.ceil((i)/4)}</span> : null
      }
    </div>);
  }
  return (
    <div className="min-h-screen">
      {pages}
      <div className='print:hidden'>
        <label htmlFor='fileInput' className='absolute mt-20 h-0 block w-full  text-xl font-bold italic text-gray-400 text-center'>Drag pictures here...</label>
        <input id='fileInput' className='h-60 w-full opacity-0' type='file' multiple ref={fileInput} onChange={fileInputChange} />
      </div>
    </div>
  );
}

// https://stackoverflow.com/questions/10333971/html5-pre-resize-images-before-uploading
async function resizeImg(file: Blob): Promise<Blob> {
  let img = document.createElement("img");
  img.src = await new Promise<any>(resolve => {
      let reader = new FileReader();
      reader.onload = (e: any) => resolve(e.target.result);
      reader.readAsDataURL(file);
  });
  await new Promise(resolve => img.onload = resolve)
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.drawImage(img, 0, 0);
  let MAX_WIDTH = 800;
  let MAX_HEIGHT = 900;
  let width = img.naturalWidth;
  let height = img.naturalHeight;
  if (width > height) {
      if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
      }
  } else {
      if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
      }
  }
  canvas.width = width;
  canvas.height = height;
  ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.drawImage(img, 0, 0, width, height);
  let result = await new Promise<Blob>((resolve, reject) => { canvas.toBlob(b => b?resolve(b):reject('canvas.toBlob failed'), 'image/jpeg', 0.95); });
  return result;
}


export default App;

