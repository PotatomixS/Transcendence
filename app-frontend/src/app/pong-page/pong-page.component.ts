import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ProfileService, Profile } from '../services/profile-service/profile.service';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-pong-page',
  templateUrl: './pong-page.component.html',
  styleUrls: ['./pong-page.component.css']
})
export class PongPageComponent implements OnInit
{
  waiting: boolean;
  matchPlaying: boolean;

  match: any;

  @ViewChild("game")  
  private gameCanvas: ElementRef;
  
  
  private canvasElement: HTMLElement | null;
  private context: any;
  private drawNumbersArray: ((x: number, y: number) => void)[];
  private socket : any;
  private watch : any;

  challenges: any[] = [];

  profile: Observable<Profile> = this.profileService.profile.asObservable();

  constructor(private profileService: ProfileService, private aroute: ActivatedRoute)
  {
    this.watch = this.aroute.snapshot.params["watch"];
    this.waiting = false;
    this.matchPlaying = false;

    this.drawNumbersArray  = [this.draw0.bind(this), this.draw1.bind(this),
      this.draw2.bind(this), this.draw3.bind(this), this.draw4.bind(this),
      this.draw5.bind(this), this.draw6.bind(this), this.draw7.bind(this),
      this.draw8.bind(this), this.draw9.bind(this)];
  }
      
  ngOnInit()
  {
    this.profileService.socket.on("StartMatch", () => {
      this.waiting = false;
      this.matchPlaying = true;
      this.loadMatch();
    });

    this.profileService.socket.on("FindingMatch", () => {
      this.profileService.getOnMatch().subscribe(res => {
        this.match = res;
      });
      this.waiting = true;
    });

    this.profileService.socket.on("GetChallenged", () => {
      this.profileService.getChallenges().subscribe(challenges => {
        this.challenges = challenges;
      });
    });

    if (!this.watch)
    {
      this.profileService.getOnMatch().subscribe(res => {
        this.match = res;
  
        if (res?.response)
          return;
        else
        {
          if (res?.waiting == true)
            this.waiting = true;
          else
          {
            this.matchPlaying = true;
            this.profileService.socket.emit("enterRoom", {
              user_id: this.profileService.profile.getValue().id,
              room_id: res.id
            });
            this.loadMatch();
          }
        }
      });
      this.profileService.getChallenges().subscribe(challenges => {
        this.challenges = challenges;
      });
    }
  }
  
  ngAfterViewInit()
  {
    this.canvasElement = document.getElementById("cv");
    this.context = this.gameCanvas.nativeElement.getContext("2d");
    this.context.fillStyle = "white";

    if (this.watch)
    {
      this.waiting = false;
      this.matchPlaying = true;

      this.profileService.socket.emit("enterRoom", {
        user_id: this.profileService.profile.getValue().id,
        room_id: parseInt(this.watch)
      });

      this.loadMatch();
    }
  }

  cancelFind()
  {
    this.profileService.cancelFind(this.match?.id).subscribe(res => {
      this.matchPlaying = false;
      this.waiting = false;
    });
  }

  startMatch(id: number = 0)
  {
    //si es 0 buscar match
    //subscribe y todo eso y después empezar
    if (id == 0)
    {
      this.profileService.findMatch().subscribe(res => {
        this.match = res;
        this.profileService.socket.emit("enterRoom", {
          user_id: this.profileService.profile.getValue().id,
          room_id: this.match.id
        });

        if (res?.findingMatch == true)
        {
          this.waiting = true;
        }
        else
        {
          this.matchPlaying = true;
          this.loadMatch();
        }
      });
    }
    else
    {
      this.profileService.acceptChallenge(id).subscribe(res => {
        if (res?.error)
        {
          alert(res.error);
          this.profileService.getChallenges().subscribe(challenges => {
            this.challenges = challenges;
          });
          return;
        }
        this.profileService.socket.emit("enterRoom", {
          user_id: this.profileService.profile.getValue().id,
          room_id: id
        });
        this.match = res;

        this.matchPlaying = true;
        this.loadMatch();
      });
    }
  }

  loadMatch()
  {
    this.profileService.socket.on("gameChanges", (data: any) =>
    {
      this.context.clearRect
      (
        0,
        0,
        this.gameCanvas.nativeElement.width,
        this.gameCanvas.nativeElement.height
      );
      if (data.wall_status == true)
        this.context.fillRect(data.wall_x, data.wall_y, 15, 140);
      this.context.fillRect(data.player1_x, data.player1_y, 15, 70);
      this.context.fillRect(data.player2_x, data.player2_y, 15, 70);
      this.context.fillRect(data.ball_x, data.ball_y, 20, 20)
      for(var i = 0; i < 960; i += 24)
      {
        this.context.fillRect(635, i, 5, 10);
      }
      this.drawPoints(data.player1_p, data.player2_p);
    })

    this.profileService.socket.on("gameFinished", () =>{
      if (this.matchPlaying == true)
      {
        this.profileService.getChallenges().subscribe(challenges => {
          this.challenges = challenges;
        });
        
        this.matchPlaying = false;
        this.waiting = false;
        
        alert("Game finished!");
      }
    });
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
  
  @HostListener('document:keydown', ['$event'])
  async onKeyDown(key: KeyboardEvent)
  {
    if (!this.match)
      return;

    if (key.key == "ArrowUp" || key.key == "ArrowDown")
      this.profileService.socket.emit("keymapChanges", {key: key.key, keyStatus: true, room_id: this.match.id, player_id: this.profileService.profile.getValue().id});
    if (key.key == "w" || key.key == "s")
      this.profileService.socket.emit("keymapChanges", {key: key.key, keyStatus: true, room_id: this.match.id, player_id: this.profileService.profile.getValue().id});
  }

  @HostListener('document:keyup', ['$event'])
  async onKeyUp(key: KeyboardEvent)
  {
    if (!this.match)
      return;
    if (key.key == "ArrowUp" || key.key == "ArrowDown")
      this.profileService.socket.emit("keymapChanges", {key: key.key, keyStatus: false, room_id: this.match.id, player_id: this.profileService.profile.getValue().id});
    if (key.key == "w" || key.key == "s")
      this.profileService.socket.emit("keymapChanges", {key: key.key, keyStatus: false, room_id: this.match.id, player_id: this.profileService.profile.getValue().id});
  }
}
