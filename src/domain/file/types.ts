// Status:
// 'CREATED',
// 'UPLOADED',
// 'STORED',
// 'CANCELLED'

export interface File {
    id: string;
    manuscriptId: string;
    created: Date;
    updated: Date;
    type: string;
    label: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    status: string;
}
