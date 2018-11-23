import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  platesWithSoatList: any;
  platesStolenList: any;
  foundPlates: any;
  foundPlatesWithoutSoat: any;
  foundPlatesStolen: any;
  db: AngularFirestore;

  constructor(db: AngularFirestore) {
    
    this.db = db;
    db.collection('plates-with-soat-list').valueChanges().subscribe(values => {
      this.platesWithSoatList = values;
    });

    db.collection('plates-stolen-list').valueChanges().subscribe(values => {
      this.platesStolenList = values;
    });

    db.collection('found-plates', ref => ref.orderBy('timestamp', 'desc').limit(10)).valueChanges().subscribe(values => {
      this.foundPlates = values;
      this.foundPlates.forEach(foundPlate => {
        foundPlate.date = this.formatdate(new Date((foundPlate.timestamp.seconds + 5 * 3600) * 1000));
        let plateWithoutSoat = true;
        let plateStolen = false;
        this.platesWithSoatList.forEach(plateWithSoat => {
          if (plateWithSoat.plateId == foundPlate.plateId) {
            plateWithoutSoat = false;
          }
        });
        if (plateWithoutSoat) this.addToFoundPlatesWithoutSoatInFirebase(foundPlate);
        this.platesStolenList.forEach(stolenPlate => {
          if (stolenPlate.plateId == foundPlate.plateId) {
            plateStolen = true;
            this.addToFoundPlatesStolenInFirebase(foundPlate);
          }
        });
      });
    });

    db.collection('found-plates-without-soat', ref => ref.orderBy('timestamp', 'desc').limit(10)).valueChanges().subscribe(values => {
      this.foundPlatesWithoutSoat = values;
    });

    db.collection('found-plates-stolen', ref => ref.orderBy('timestamp', 'desc').limit(10)).valueChanges().subscribe(values => {
      this.foundPlatesStolen = values;
    });
  }

  addToFoundPlatesWithoutSoatInFirebase(foundPlate) {
    console.log("entro aca");
    this.db.collection('found-plates-without-soat', ref => ref.where
      ('plateId', '==', foundPlate.plateId)).valueChanges().subscribe(samePlateFound => {
        console.log("Entro al query collection y samePlateFound: " + samePlateFound);
        if (samePlateFound.length == 0) this.db.collection('found-plates-without-soat').add(foundPlate);
      })
  }

  addToFoundPlatesStolenInFirebase(foundPlate) {
    this.db.collection('found-plates-stolen', ref => ref.where
      ('plateId', '==', foundPlate.plateId)).valueChanges().subscribe(samePlateFound => {
        foundPlate.alertShown = true;
        if (samePlateFound.length == 0) {
          this.db.collection('found-plates-stolen').add(foundPlate);
          // alert('Se encontró un carro robado con placa: ' + foundPlate.plateId + 'a la siguiente hora: ' + foundPlate.date);
          const alertText = 'Se encontró un carro robado con placa: ' + foundPlate.plateId + ' a la siguiente hora: ' + foundPlate.date
          swal({
            title: alertText,
            animation: false,
            type: 'warning',
            customClass: 'animated tada',
            showCancelButton: true,
            cancelButtonText: 'Confirmado',
            showConfirmButton: false,
            cancelButtonColor: '#d33',
          });
          var audio = new Audio('../../assets/alert_sound.wav');
          audio.load();
          audio.play();
        }
      })
  }

  ngOnInit() {
  }

  formatdate(date: Date) {
    const dayMonthYear = date.getDate() + "/" + this.pad(date.getMonth() + 1) + "/" + this.pad(date.getFullYear());
    const hourMinuteSeconds = date.getHours() + ":" + this.pad(date.getMinutes()) + ":" + this.pad(date.getSeconds());
    return dayMonthYear + ' - ' + hourMinuteSeconds
  }

  pad(t) {
    var st = "" + t;
    while (st.length < 2)
      st = "0" + st;

    return st;
  }

}
