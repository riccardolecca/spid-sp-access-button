import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  OnInit,
  OnDestroy,
  HostListener,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

export interface SpidIdp {
  organization_name: string;
  entity_id: string;
  logo_uri: string;
}

const SPID_REGISTRY_URL =
  'https://registry.spid.gov.it/entities-idp?&output=json&custom=info_display_base';

const FALLBACK_IDPS: SpidIdp[] = [
  { organization_name: 'ArubaPEC S.p.A.', entity_id: 'https://loginspid.aruba.it', logo_uri: 'img/spid-idp-arubaid.svg' },
  { organization_name: 'InfoCert S.p.A.', entity_id: 'https://identity.infocert.it', logo_uri: 'img/spid-idp-infocertid.svg' },
  { organization_name: 'IN.TE.S.A. S.p.A.', entity_id: 'https://spid.intesa.it', logo_uri: 'img/spid-idp-intesaid.svg' },
  { organization_name: 'Lepida S.p.A.', entity_id: 'https://id.lepida.it/idp/shibboleth', logo_uri: 'img/spid-idp-lepidaid.svg' },
  { organization_name: 'Namirial', entity_id: 'https://idp.namirialtsp.com/idp', logo_uri: 'img/spid-idp-namirialid.svg' },
  { organization_name: 'Poste Italiane SpA', entity_id: 'https://posteid.poste.it', logo_uri: 'img/spid-idp-posteid.svg' },
  { organization_name: 'Sielte S.p.A.', entity_id: 'https://identity.sieltecloud.it', logo_uri: 'img/spid-idp-sielteid.svg' },
  { organization_name: 'Register.it S.p.A.', entity_id: 'https://spid.register.it', logo_uri: 'img/spid-idp-spiditalia.svg' },
  { organization_name: 'TI Trust Technologies srl', entity_id: 'https://login.id.tim.it/affwebservices/public/saml2sso', logo_uri: 'img/spid-idp-timid.svg' },
  { organization_name: 'TeamSystem s.p.a.', entity_id: 'https://spid.teamsystem.com/idp', logo_uri: 'img/spid-idp-teamsystemid.svg' },
];

const SPID_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 587.6 587.6">
  <path fill="#FFF" d="M587.6 293.8c0 162.3-131.5 293.8-293.8 293.8C131.6 587.6 0 456.1 0 293.8S131.6 0 293.8 0c162.3 0 293.8 131.5 293.8 293.8"/>
  <path fill="#06C" d="M294.6 319c-24.4 0-44.5-8.2-60.3-24.8-15.8-16.5-23.7-37-23.7-61.4 0-24.5 7.9-44.8 23.6-61 15.7-16.2 35.7-24.3 60.2-24.3 24.4 0 44.3 8.2 59.6 24.9 15.3 16.6 23 37 23 61.5 0 24.3-7.7 44.6-23 60.8-15.3 16.1-35 24.3-59.4 24.3"/>
  <path fill="#06C" d="M210.6 439.1c0-24.5 7.9-44.8 23.5-61 15.7-16.2 35.7-24.3 60.4-24.3 24.4 0 44.3 8.2 59.5 24.9 15.3 16.7 23 37.1 23 61.5"/>
</svg>`;

@Component({
  selector: 'spid-button',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- GET mode -->
    <ng-container *ngIf="method === 'get'">
      <a href="#"
         class="italia-it-button button-spid"
         [ngClass]="'italia-it-button-size-' + size"
         [class.spid-idp-button-open]="isOpen"
         aria-haspopup="true"
         [attr.aria-expanded]="isOpen"
         (click)="toggle($event)">
        <span class="italia-it-button-icon" [innerHTML]="spidIcon"></span>
        <span class="italia-it-button-text">Entra con SPID</span>
      </a>

      <div class="spid-idp-button spid-idp-button-tip spid-idp-button-relative"
           [class.spid-idp-button-open-panel]="isOpen">
        <ul class="spid-idp-button-menu">
          <li *ngFor="let idp of idps" class="spid-idp-button-link">
            <a [href]="idp.entity_id" (click)="onIdpSelected($event, idp)">
              <span class="spid-sr-only">{{ idp.organization_name }}</span>
              <img [src]="idp.logo_uri" [alt]="idp.organization_name" />
            </a>
          </li>
          <li class="spid-idp-support-link">
            <a href="https://www.spid.gov.it">Maggiori informazioni</a>
          </li>
          <li class="spid-idp-support-link">
            <a href="https://www.spid.gov.it/richiedi-spid">Non hai SPID?</a>
          </li>
          <li class="spid-idp-support-link">
            <a href="https://www.spid.gov.it/serve-aiuto">Serve aiuto?</a>
          </li>
        </ul>
      </div>
    </ng-container>

    <!-- POST mode -->
    <ng-container *ngIf="method === 'post'">
      <a href="#"
         class="italia-it-button button-spid"
         [ngClass]="'italia-it-button-size-' + size"
         [class.spid-idp-button-open]="isOpen"
         aria-haspopup="true"
         [attr.aria-expanded]="isOpen"
         (click)="toggle($event)">
        <span class="italia-it-button-icon" [innerHTML]="spidIcon"></span>
        <span class="italia-it-button-text">Entra con SPID</span>
      </a>

      <div class="spid-idp-button spid-idp-button-tip spid-idp-button-relative"
           [class.spid-idp-button-open-panel]="isOpen">
        <ul class="spid-idp-button-menu">
          <li *ngFor="let idp of idps" class="spid-idp-button-link">
            <button class="idp-button-idp-logo"
                    type="button"
                    (click)="onIdpSelected($event, idp)">
              <span class="spid-sr-only">{{ idp.organization_name }}</span>
              <img class="spid-idp-button-logo"
                   [src]="idp.logo_uri"
                   [alt]="idp.organization_name" />
            </button>
          </li>
          <li class="spid-idp-support-link">
            <a href="https://www.spid.gov.it">Maggiori informazioni</a>
          </li>
          <li class="spid-idp-support-link">
            <a href="https://www.spid.gov.it/richiedi-spid">Non hai SPID?</a>
          </li>
          <li class="spid-idp-support-link">
            <a href="https://www.spid.gov.it/serve-aiuto">Serve aiuto?</a>
          </li>
        </ul>
      </div>
    </ng-container>
  `,
  styles: [`
    /* ===== Titillium Web — use Google Fonts CDN to avoid bundling font files ===== */
    @import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600&display=swap');

    /* ===== SPID Button ===== */
    spid-button {
      display: inline-block;
      position: relative;
    }

    .italia-it-button {
      display: inline-block;
      position: relative;
      padding: 0;
      color: #fff;
      font-family: 'Titillium Web', HelveticaNeue, 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif;
      font-weight: 600;
      line-height: 1em;
      text-decoration: none;
      border: 0;
      text-align: center;
      cursor: pointer;
      overflow: hidden;
    }

    .italia-it-button-icon,
    .italia-it-button-text {
      display: block;
      float: left;
    }

    .italia-it-button-icon {
      margin: 0 -0.4em 0 0;
      padding: 0.6em 0.8em 0.5em;
      border-right: rgba(255, 255, 255, 0.1) 0.1em solid;
    }

    .italia-it-button-icon svg {
      width: 1.8em;
      height: 1.8em;
    }

    .italia-it-button-text {
      padding: 0.95em 1em 0.85em 1em;
      font-size: 1.15em;
      text-align: center;
    }

    /* Sizes */
    .italia-it-button-size-s { font-size: 10px; width: 150px; }
    .italia-it-button-size-s > span img,
    .italia-it-button-size-s > span svg { width: 19px; height: 19px; border: 0; }

    .italia-it-button-size-m { font-size: 15px; width: 220px; }
    .italia-it-button-size-m > span img,
    .italia-it-button-size-m > span svg { width: 29px; height: 29px; border: 0; }

    .italia-it-button-size-l { font-size: 20px; width: 280px; }
    .italia-it-button-size-l > span img,
    .italia-it-button-size-l > span svg { width: 38px; height: 38px; border: 0; }

    .italia-it-button-size-xl { font-size: 25px; width: 340px; }
    .italia-it-button-size-xl > span img,
    .italia-it-button-size-xl > span svg { width: 47px; height: 47px; border: 0; }

    /* Colors */
    .button-spid { background-color: #06c; color: #fff; }
    .button-spid:hover { background-color: #036; color: #fff; }
    .button-spid:active { background-color: #83beed; color: #036; }

    /* ===== Dropdown panel ===== */
    .spid-idp-button {
      position: absolute;
      z-index: 1039;
      display: none;
    }

    .spid-idp-button.spid-idp-button-open-panel {
      display: block;
    }

    .spid-idp-button .spid-idp-button-menu {
      list-style: none;
      background: white;
      border: solid 1px #ddd;
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
      overflow: visible;
      padding: 0;
      margin: 0;
      min-width: 230px;
    }

    .spid-idp-button.spid-idp-button-tip { margin-top: 8px; }

    .spid-idp-button.spid-idp-button-tip::before {
      position: absolute;
      top: -6px;
      left: 9px;
      content: '';
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-bottom: 7px solid #ddd;
      display: inline-block;
    }

    .spid-idp-button.spid-idp-button-tip::after {
      position: absolute;
      top: -5px;
      left: 10px;
      content: '';
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 6px solid white;
      display: inline-block;
    }

    /* Menu items */
    .spid-idp-button .spid-idp-button-menu li {
      list-style: none;
      padding: 0;
      margin: 0;
      line-height: 18px;
    }

    .spid-idp-button .spid-idp-button-menu li > a,
    .spid-idp-button .spid-idp-button-menu label {
      display: block;
      font-family: 'Titillium Web', HelveticaNeue, 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif;
      font-weight: 600;
      font-size: 0.9em;
      color: #06c;
      text-decoration: underline;
      line-height: 18px;
      padding-top: 5px;
      white-space: nowrap;
      border-bottom: 1px solid #ddd;
    }

    .spid-idp-button .spid-idp-button-menu li > a:hover,
    .spid-idp-button .spid-idp-button-menu label:hover {
      color: #036;
      cursor: pointer;
      background-color: #f0f0f0;
    }

    .spid-idp-button .spid-idp-button-menu li > a img {
      height: 25px;
      padding: 10px 0 10px 10px;
      border: 0;
    }

    /* POST button style */
    .idp-button-idp-logo {
      font-size: 100%;
      height: 10%;
      width: 100%;
      border: 0;
      border-bottom: 1px solid #ccc;
      background-color: #fff;
      padding: 15px;
      text-align: left;
      cursor: pointer;
    }

    .idp-button-idp-logo:hover { background-color: #f0f0f0; }
    .idp-button-idp-logo img { height: 25px; vertical-align: middle; cursor: pointer; }

    /* Support links */
    .spid-idp-support-link > a { padding: 5px 0 10px 10px; }

    /* Screen reader only */
    .spid-sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }
  `],
})
export class SpidButtonComponent implements OnInit, OnDestroy {
  /** Dimensione del bottone: 's' | 'm' | 'l' | 'xl' */
  @Input() size: 's' | 'm' | 'l' | 'xl' = 'm';

  /** Metodo: 'get' per link, 'post' per form submit */
  @Input() method: 'get' | 'post' = 'get';

  /** URL del registry SPID (opzionale, default: registry ufficiale AgID) */
  @Input() registryUrl: string = SPID_REGISTRY_URL;

  /** Lista IDP custom. Se fornita, non viene chiamato il registry. */
  @Input() customIdps: SpidIdp[] | null = null;

  /** Emesso quando l'utente seleziona un IDP */
  @Output() idpSelected = new EventEmitter<SpidIdp>();

  idps: SpidIdp[] = [];
  isOpen = false;
  spidIcon = SPID_ICON_SVG;

  private el = inject(ElementRef);
  private http = inject(HttpClient);

  ngOnInit(): void {
    if (this.customIdps) {
      this.idps = this.shuffle([...this.customIdps]);
    } else {
      this.http
        .get<SpidIdp[]>(this.registryUrl)
        .pipe(catchError(() => of(FALLBACK_IDPS)))
        .subscribe((list) => {
          this.idps = this.shuffle([...list]);
        });
    }
  }

  ngOnDestroy(): void {
    this.isOpen = false;
  }

  toggle(evt: Event): void {
    evt.preventDefault();
    evt.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  onIdpSelected(evt: Event, idp: SpidIdp): void {
    evt.preventDefault();
    this.isOpen = false;
    this.idpSelected.emit(idp);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(evt: Event): void {
    if (!this.el.nativeElement.contains(evt.target as Node)) {
      this.isOpen = false;
    }
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    this.isOpen = false;
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
