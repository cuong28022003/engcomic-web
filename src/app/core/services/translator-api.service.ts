import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';

export interface TranslateResponse {
  word: string;
  ipa?: string;
  meaning?: string;
  examples?: string[];
}

export interface OcrResponse {
  text: string;
}

@Injectable({ providedIn: 'root' })
export class TranslatorApiService extends ApiBaseService {
  private readonly BASE = '/translator';

  translateText(data: {
    text: string;
    imageUrl?: string;
  }): Observable<TranslateResponse> {
    return this.post<TranslateResponse>(`${this.BASE}/ipa-meaning`, data);
  }

  ocr(formData: FormData): Observable<OcrResponse> {
    return this.postForm<OcrResponse>(`${this.BASE}/ocr`, formData);
  }
}
