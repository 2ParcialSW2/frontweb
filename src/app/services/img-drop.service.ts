import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ImgDropService {

  constructor(private http: HttpClient) { }

  url: string = 'https://api.cloudinary.com/v1_1/day1tsmdn/image/upload'

  uploadImg(data: any): Observable<any> {
    return this.http.post(this.url, data);
  }
}
