import 'zone.js/dist/zone';
import {
  Component,
  Directive,
  ElementRef,
  HostBinding,
  Inject,
  Output,
  OnInit,
  importProvidersFrom,
  Input,
  ContentChild,
  TemplateRef,
} from '@angular/core';
import {
  AsyncPipe,
  CommonModule,
  DOCUMENT,
  NgFor,
  NgIf,
} from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import { CdkTableModule } from '@angular/cdk/table';
import { BehaviorSubject, combineLatest, fromEvent } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Directive({
  selector: '[resizable]',
  standalone: true,
})
export class ResizableDirective {
  @Output()
  readonly resizable = fromEvent<MouseEvent>(
    this.elementRef.nativeElement,
    'mousedown'
  ).pipe(
    tap((e) => e.preventDefault()),
    switchMap(() => {
      const { width, right } = this.elementRef.nativeElement
        .closest('th')!
        .getBoundingClientRect();

      return fromEvent<MouseEvent>(this.documentRef, 'mousemove').pipe(
        map(({ clientX }) => width + clientX - right),
        distinctUntilChanged(),
        takeUntil(fromEvent(this.documentRef, 'mouseup'))
      );
    })
  );

  constructor(
    @Inject(DOCUMENT) private readonly documentRef: Document,
    @Inject(ElementRef)
    private readonly elementRef: ElementRef<HTMLElement>
  ) {}
}

@Component({
  selector: 'th[resizable]',
  standalone: true,
  imports: [ResizableDirective],
  template: `
  <div class="wrapper">
    <div class="content">
      <ng-content></ng-content>
    </div>
    <div class="bar" (resizable)="onResize($event)"></div>
  </div>
  `,
  styles: [
    `
  :host {
    &:last-child .bar {
      display: none;
    }
  }
  
  .wrapper {
    display: flex;
    justify-content: flex-end;
  }
  
  .content {
    flex: 1;
  }
  
  .bar {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    margin: 0 -16px 0 16px;
    justify-self: flex-end;
    border-left: 2px solid transparent;
    border-right: 2px solid transparent;
    background: blueviolet;
    background-clip: content-box;
    cursor: ew-resize;
    opacity: 0;
    transition: opacity .3s;
  }

  .bar:hover,
  .bar:active {
      opacity: 1;
    }
  `,
  ],
})
export class ResizableComponent {
  @HostBinding('style.width.px')
  width: number | null = null;

  onResize(width: number) {
    this.width = width;
  }
}

@Directive({
  selector: '[column-template]',
  standalone: true,
})
export class ColumnTemplateDirective {
  @Input('column-template') columnKey: string | null = null;
  constructor(public template: TemplateRef<any>) {}
}

@Component({
  selector: 'strong-text',
  standalone: true,
  template: `<strong><ng-content></ng-content></strong>`,
  styles: [``],
})
export class StrongTextComponent {}

type User = {
  id: number;
  name: string;
  age: number;
  greeting: string;
};

type UserKey = keyof User;

type SortDir = 'asc' | 'desc' | '';

@Component({
  selector: 'my-table',
  standalone: true,
  imports: [
    CdkTableModule,
    ResizableComponent,
    ResizableDirective,
    AsyncPipe,
    NgIf,
    NgFor,
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
  template: `
    <div class="table-wrapper">
      <table cdk-table [dataSource]="data$" multiTemplateDataRows cellspacing="0" cellpadding="0">

        <tr cdk-header-row *cdkHeaderRowDef="columns"></tr>
        <tr cdk-row *cdkRowDef="let row; columns: columns" (click)="setExpandedRow(row)" class="row"></tr>
        <tr cdk-row *cdkRowDef="let row; columns: ['expandedContent']" class="row-detail"></tr>
        
        <ng-container *ngFor="let column of columns; let i = index">
          <ng-container [cdkColumnDef]="column">
            <th cdk-header-cell *cdkHeaderCellDef resizable>
              <div>
                headers[i]
                <button class="sort-btn" (click)="sort(column)">
                  <span *ngIf="sortKey === column">{{ sortDir === 'asc' ? '▾' : '▴' }}</span>
                </button>
              </div>
            </th>
            <td cdk-cell *cdkCellDef="let row" style="border-bottom-width: 0;">
              {{ getValueUsingKey(row, column) }}
            </td>
          </ng-container>
        </ng-container>

        <!-- non value column -->
        <ng-container cdkColumnDef="action">
          <th cdk-header-cell *cdkHeaderCellDef></th>
          <td cdk-cell *cdkCellDef="let row">
            <button (click)="greet(row)">Greet</button>
          </td>
        </ng-container>

        <!-- exapned content column 
        <ng-container cdkColumnDef="expandedContent">
          <td cdk-cell *cdkCellDef="let row" [attr.colspan]="columns.length">
            <div class="row-detail-content"
            [@detailExpand]="row.id == expandedRow ? 'expanded' : 'collapsed'">
            
              <div style="padding: 1rem;">
                Some extra content
              </div>
            </div>
          </td>
        </ng-container> -->
      
      </table>
    </div>
  `,
  styles: [
    `
    .table-wrapper {
      position: realtive;
      border: 1px solid #dddddd;
      border-radius: 8px;
      overflow-x: auto;
    }
    
    table[cdk-table] {
      width: 100%;
      position: realtive;
      border: none;
      min-width: 500px;
      position: relative;
    }
    
    tr[cdk-header-row] {
      text-align: left;
    }
    
    tr[cdk-row] {}
    
    .row td[cdk-cell],
    th[cdk-header-cell] {
      padding: 12px;
      box-sizing: border-box;
    }
    
    td[cdk-cell] {
      
    }
    
    th[cdk-header-cell] {
      
    }
    th[cdk-header-cell] div {
      display: flex;
      justify-content: space-between;
    }
    
    .sort-btn {
      width: 24px;
      height: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      border: none;
      background-color: transparent;
      border-radius: 8px;
      color: #909090;
      font-size: 18px;
    }
    
    .sort-btn:hover {
      background-color: #eeeeee;
    }
    
    .row:hover {
      background: rgba(0, 0, 0, 0.05);
      cursor: pointer;
    }

    .row td{
      border-top: 1px solid #dddddd;
    }
    
    tr.row-detail {
      height: 0;
    }
    
    tr.row-detail td {
      border-bottom-width: 0;
    }
    
    .row-detail-content {
      overflow: hidden;
      display: flex;
    }
  `,
  ],
})
export class MyTable<T> implements OnInit {
  @Input() columns: (keyof T | string)[] = [];

  @Input() data: T[] = [];

  @Input() headers: string[] = [];

  data$: BehaviorSubject<T[]> = new BehaviorSubject(this.data);

  sortKey!: keyof T | null;
  sortDir!: SortDir;

  sortKey$ = new BehaviorSubject<keyof T | null>(null);
  sortDirection$ = new BehaviorSubject<SortDir>('asc');

  expandedRow!: number | null;

  @ContentChild(ColumnTemplateDirective)
  columnTemplate!: ColumnTemplateDirective;

  ngOnInit(): void {
    combineLatest([this.sortKey$, this.sortDirection$])
      .pipe(
        tap(([key, dir]) => {
          this.sortKey = key;
          this.sortDir = dir;
        })
      )
      .subscribe({
        next: ([key, dir]) => {
          this.getUsers(key, dir);
        },
      });
  }

  getUsers(sortKey: keyof T | null, sortDirection: SortDir) {
    // do sorting here
    if (sortKey) {
      this.data$.next(
        this.data.sort((a, b) => {
          if (sortDirection === 'asc') {
            return a[sortKey] > b[sortKey] ? 1 : -1;
          } else {
            return a[sortKey] < b[sortKey] ? 1 : -1;
          }
        })
      );
    }
  }

  sort(key: keyof T) {
    const dir = this.sortDirection$.value;
    this.sortKey$.next(key);
    this.sortDirection$.next(dir === 'asc' ? 'desc' : 'asc');
  }

  greet(user: User) {
    alert(user.greeting);
  }

  setExpandedRow(user: User) {
    this.expandedRow = this.expandedRow === user.id ? null : user.id;
  }

  getValueUsingKey(row: T, key: keyof T) {
    return row[key];
  }
}

@Component({
  selector: 'my-app',
  standalone: true,
  imports: [CommonModule, MyTable],
  template: `
    <my-table [data]="data" [columns]="columns" />
  `,
})
export class App {
  columns: (UserKey | string)[] = ['id', 'age', 'name', 'greeting', 'action'];

  data: User[] = [
    { id: 1, age: 20, name: 'Jacob Doe', greeting: 'Hello there!' },
    { id: 2, age: 24, name: 'Jane Doe', greeting: 'Hiya!!' },
    { id: 3, age: 17, name: 'Jamie Doe', greeting: 'Whatever...' },
    { id: 4, age: 42, name: 'John Doe', greeting: 'Can I help you?' },
  ];
}

bootstrapApplication(App, {
  providers: [importProvidersFrom([BrowserAnimationsModule])],
});
