class Reservation {
  constructor(d) {
    Object.assign(this, d);
    this.cantidad_participantes = parseInt(d.cantidad_participantes || 0, 10);
  }
}
module.exports = Reservation;
