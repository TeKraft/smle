import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { ingestionConfig } from '../ingestion.config.service';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {

  public url: string;
  public sanitizedUrl: SafeResourceUrl;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    const snapshot = this.route.snapshot;
    if (snapshot.params['id']) {
      const streamId = snapshot.params['id'];
      this.createUrl(streamId);
    }
  }

  public toStreams() {
    this.router.navigate(['/streams']);
  }

  private createUrl(streamId: string) {
    this.url = ingestionConfig.kibanaUrl + 'visualize/edit/' + streamId + '?embed=true&_g=(refreshInterval:("$$hashKey":"object:1080",display:"10+seconds",pause:!f,section:1,value:10000),time:(from:now-7d,mode:quick,to:now))&_a=(filters:!(),linked:!f,query:(language:lucene,query:"streamName:' + streamId + '+AND+statistics.IngestObservation.persisted%3Dtrue"),uiState:(),vis:(aggs:!((enabled:!t,id:"1",params:(customLabel:"Ingested Observations"),schema:metric,type:count),(enabled:!t,id:"3",params:(field:statistics.IngestObservation.phenomenon.keyword,size:10),schema:group,type:significant_terms),(enabled:!t,id:"4",params:(customInterval:"2h",extended_bounds:(),field:"@timestamp",interval:h,min_doc_count:1),schema:segment,type:date_histogram)),params:(addLegend:!t,addTimeMarker:!f,addTooltip:!t,categoryAxes:!((id:CategoryAxis-1,labels:(show:!t,truncate:100),position:bottom,scale:(type:linear),show:!t,style:(),title:(),type:category)),grid:(categoryLines:!f,style:(color:%23eee),valueAxis:ValueAxis-1),legendPosition:right,seriesParams:!((data:(id:"1",label:"Ingested Observations"),drawLinesBetweenPoints:!t,mode:normal,show:true,showCircles:!t,type:histogram,valueAxis:ValueAxis-1)),times:!(),type:histogram,valueAxes:!((id:ValueAxis-1,labels:(filter:!f,rotate:0,show:!t,truncate:100),name:LeftAxis-1,position:left,scale:(mode:normal,type:linear),show:!t,style:(),title:(text:"Ingested Observations"),type:value))),title:' + streamId + ',type:histogram))';
    this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }

}
