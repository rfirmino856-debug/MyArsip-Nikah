export const AdminWelcome = () => (
  <section className="cms-welcome" aria-labelledby="cms-welcome-title">
    <div className="cms-welcome__intro">
      <span className="cms-welcome__eyebrow">PUSAT PENGELOLAAN ARSIP</span>
      <h1 id="cms-welcome-title">Selamat datang di MyArsip Nikah</h1>
      <p>
        Kelola template surat dan berkas arsip pernikahan Desa Pelang Kidul dari satu tempat.
      </p>
    </div>

    <div className="cms-welcome__links" aria-label="Akses cepat">
      <a className="cms-welcome__card" href="/admin/collections/arsip-nikah">
        <span className="cms-welcome__icon" aria-hidden="true">00</span>
        <span className="cms-welcome__card-copy">
          <strong>Arsip nikah</strong>
          <span>Tambah, perbarui, dan kelola data arsip pernikahan.</span>
        </span>
        <span className="cms-welcome__arrow" aria-hidden="true">→</span>
      </a>
      <a className="cms-welcome__card" href="/admin/collections/template-surat">
        <span className="cms-welcome__icon" aria-hidden="true">01</span>
        <span className="cms-welcome__card-copy">
          <strong>Template surat</strong>
          <span>Atur format, kop, persyaratan, dan penandatangan surat.</span>
        </span>
        <span className="cms-welcome__arrow" aria-hidden="true">→</span>
      </a>
      <a className="cms-welcome__card" href="/admin/collections/media-arsip">
        <span className="cms-welcome__icon" aria-hidden="true">02</span>
        <span className="cms-welcome__card-copy">
          <strong>Berkas scan</strong>
          <span>Simpan dan temukan kembali dokumen arsip yang diunggah.</span>
        </span>
        <span className="cms-welcome__arrow" aria-hidden="true">→</span>
      </a>
    </div>
  </section>
);
