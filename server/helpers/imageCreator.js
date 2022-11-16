const {createCanvas, loadImage} = require('canvas');
const Path = require('path');

class ImageCreator {
  constructor() {
    this._name = 'ImageCreator';
  }

  async generate(){
    const canvas = createCanvas(500, 200);
    const ctx = canvas.getContext('2d');

    const path = Path.join(__dirname, '../../public/images/test-gif.gif');

    console.log(path);

    const image = await loadImage(path);
    ctx.drawImage(image, 50, 50, 150, 150);

    ctx.font = '20px Micra';
    ctx.rotate(0.1);
    ctx.fillText('Я сгенерированный текст!', 10, 150);

    ctx.rotate(-0.1);
    ctx.fillStyle = "rgba(255,0,12,0.72)";
    ctx.fillText('И я текст', 200, 50);

    // Draw line under text
    var text = ctx.measureText('Я сгенерированный текст!');
    ctx.strokeStyle = 'rgba(26,160,63,0.55)';
    ctx.beginPath();
    ctx.lineTo(50, 102);
    ctx.lineTo(50 + text.width, 102);
    ctx.stroke();

    return canvas.toDataURL();
  }
}

module.exports = new ImageCreator();