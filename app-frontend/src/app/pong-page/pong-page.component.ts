import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-pong-page',
  templateUrl: './pong-page.component.html',
  styleUrls: ['./pong-page.component.css']
})
export class PongPageComponent implements OnInit
{

  @ViewChild("game")  
  private gameCanvas: ElementRef;
  
  
  private canvasElement: HTMLElement | null;
  private context: any;
  private drawNumbersArray: ((x: number, y: number) => void)[];
  
  constructor()
  {
    this.drawNumbersArray  = [this.draw0.bind(this), this.draw1.bind(this),
       this.draw2.bind(this), this.draw3.bind(this), this.draw4.bind(this),
        this.draw5.bind(this), this.draw6.bind(this), this.draw7.bind(this),
         this.draw8.bind(this), this.draw9.bind(this)];
  }

  ngOnInit()
  {
    
  }

  ngAfterViewInit()
  {
    this.canvasElement = document.getElementById("cv");
    this.context = this.gameCanvas.nativeElement.getContext("2d");
    this.context.fillStyle = "white";
    this.context.clearRect(
      0,
      0,
      this.gameCanvas.nativeElement.width,
      this.gameCanvas.nativeElement.height
    );
    this.context.fillRect(15, 405, 15, 70);
    this.context.fillRect(1240, 405, 15, 70);
    for(var i = 0; i < 960; i += 24)
    {
      this.context.fillRect(635, i, 5, 10);
    }
    this.drawPoints(8, 9);
  }

  drawPoints(points1: number, points2: number)
  {
    if (points1 < 10)
      this.drawNumbersArray[points1](320, 40);
    else if (points1 >= 10)
    {
      
    }
    if (points2 < 10)
      this.drawNumbersArray[points2](960, 40);
    else if (points2 >= 10)
    {

    }
  }

  draw0(x: number, y: number)
  {
    this.context.fillRect(x, y, 40, 10);
    this.context.fillRect(x, y + 70, 40, 10);
    this.context.fillRect(x, y, 10, 80);
    this.context.fillRect(x + 30, y, 10, 80);
  }

  draw1(x: number, y: number)
  {
    this.context.fillRect(x + 30, y, 10, 80);
  }

  draw2(x: number, y: number)
  {
    this.context.fillRect(x, y, 40, 10);
    this.context.fillRect(x, y + 30, 40, 10);
    this.context.fillRect(x, y + 70, 40, 10);
    this.context.fillRect(x + 30, y, 10, 30);
    this.context.fillRect(x, y + 30, 10, 50);
  }

  draw3(x: number, y: number)
  {
    this.context.fillRect(x, y, 40, 10);
    this.context.fillRect(x, y + 30, 40, 10);
    this.context.fillRect(x, y + 70, 40, 10);
    this.context.fillRect(x + 30, y, 10, 80);
  }

  draw4(x: number, y: number)
  {
    this.context.fillRect(x, y + 30, 40, 10);
    this.context.fillRect(x, y, 10, 30);
    this.context.fillRect(x + 30, y, 10, 80);
  }

  draw5(x: number, y: number)
  {
    this.context.fillRect(x, y, 40, 10);
    this.context.fillRect(x, y + 30, 40, 10);
    this.context.fillRect(x, y + 70, 40, 10);
    this.context.fillRect(x, y, 10, 30);
    this.context.fillRect(x + 30, y + 30, 10, 50);
  }

  draw6(x: number, y: number)
  {
    this.context.fillRect(x, y + 30, 40, 10);
    this.context.fillRect(x, y + 70, 40, 10);
    this.context.fillRect(x, y, 10, 80);
    this.context.fillRect(x + 30, y + 30, 10, 50);
  }

  draw7(x: number, y: number)
  {
    this.context.fillRect(x, y, 40, 10);
    this.context.fillRect(x + 30, y, 10, 80);
  }

  draw8(x: number, y: number)
  {
    this.context.fillRect(x, y, 40, 10);
    this.context.fillRect(x, y + 30, 40, 10);
    this.context.fillRect(x, y + 70, 40, 10);
    this.context.fillRect(x, y, 10, 80);
    this.context.fillRect(x + 30, y, 10, 80);
  }

  draw9(x: number, y: number)
  {
    this.context.fillRect(x, y, 40, 10);
    this.context.fillRect(x, y + 30, 40, 10);
    this.context.fillRect(x, y, 10, 30);
    this.context.fillRect(x + 30, y, 10, 80);
  }

}
