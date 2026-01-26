import { Component, OnInit } from '@angular/core';
import { ContiContabiliService } from '../service/conti-contabili.service';
import { ContiContabili } from 'c:/Repository/FORMAZIONE/esercizi angular 3/AlessandroDeFilippis-bank-movements-manager/bank-movement-manager/src/app/model/conti-contabili';

@Component({
  selector: 'app-conti-contabili',
  templateUrl: './conti-contabili.component.html',
  styleUrls: ['./conti-contabili.component.css']
})
export class ContiContabiliComponent implements OnInit {

  contiContabili: ContiContabili[] = [];
  
  constructor(
    private contiContabiliService : ContiContabiliService
  ) { }

  ngOnInit(): void {
    this.getContiContabili();
  }
  getContiContabili() {
    this.contiContabiliService.getconxticontabili().subscribe(
      (      contiContabili: ContiContabili[]) => this.contiContabili = contiContabili
    );
  }
    


}
