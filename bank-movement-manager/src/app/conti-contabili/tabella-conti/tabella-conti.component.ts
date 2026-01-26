import { Component, Input, OnInit } from '@angular/core';
import { ContiContabili } from 'src/app/model/conti-contabili';

@Component({
  selector: 'app-tabella-conti',
  templateUrl: './tabella-conti.component.html',
  styleUrls: ['./tabella-conti.component.css']
})
export class TabellaContiComponent implements OnInit {
   @Input()contiContabili: ContiContabili[] = [];
   
  constructor() { }

  ngOnInit(): void {
  }

}
