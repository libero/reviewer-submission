/* eslint-disable @typescript-eslint/camelcase */
import * as xmlbuilder from 'xmlbuilder';
import axios from 'axios';
import Submission, { ArticleType } from '../../models/submission';
import user_api_url from '../../../../../config';

interface Person {
    id: string;
    email: string;
    name: {
        surname: string;
        'given-names': string;
    };
    affiliations: string;
}

interface PersonAffiliationResource {
    name: string[];
}

interface PersonResource {
    id: string;
    name: {
        surname: string;
        givenNames: string;
    };
    emailAddresses: { value: string }[];
    affiliations?: PersonAffiliationResource[];
}

interface EditorContrib {
    '@content-type': string;
    contrib: {
        '@contrib-type': string;
    };
}

const articleTypeMap: { [key in ArticleType]: number } = {
    'research-article': 5,
    'short-report': 13,
    'tools-resources': 18,
    'scientific-correspondence': 20,
    'research-advance': 999, // @todo whats the value?
    feature: 23,
};

const majorSubjectAreas: { [key: string]: string } = {
    'biochemistry-chemical-biology': 'Biochemistry and Chemical Biology',
    'cancer-biology': 'Cancer Biology',
    'cell-biology': 'Cell Biology',
    'chromosomes-gene-expression': 'Chromosomes and Gene Expression',
    'computational-systems-biology': 'Computational and Systems Biology',
    'developmental-biology': 'Developmental Biology',
    ecology: 'Ecology',
    'epidemiology-global-health': 'Epidemiology and Global Health',
    'evolutionary-biology': 'Evolutionary Biology',
    'genetics-genomics': 'Genetics and Genomics',
    'human-biology-medicine': 'Human Biology and Medicine',
    'immunology-inflammation': 'Immunology and Inflammation',
    'microbiology-infectious-disease': 'Microbiology and Infectious Disease',
    neuroscience: 'Neuroscience',
    'physics-living-systems': 'Physics of Living Systems',
    'plant-biology': 'Plant Biology',
    'stem-cells-and-regenerative-medicine': 'Stem Cells and Regenerative Medicine',
    'structural-biology-molecular-biophysics': 'Structural Biology and Molecular Biophysics',
};

export default class ArticleGenerator {
    private editors: Person[] = [];
    private affiliations: string[] = [];

    constructor(private readonly submission: Submission) {}

    async getPerson(id: string): Promise<Person | null> {
        const { data } = await axios.get<PersonResource>(`${user_api_url}/editors/${id}`);

        if (!data) {
            return null;
        }

        const { affiliations = [] } = data;

        return {
            id,
            name: {
                surname: data.name.surname,
                'given-names': data.name.givenNames,
            },
            email: data.emailAddresses.length ? data.emailAddresses[0].value : '',
            affiliations: affiliations
                .map((affiliation: PersonAffiliationResource): string => affiliation.name.join(', '))
                .join(', '),
        };
    }

    async _prepare(): Promise<void> {
        const {
            editorDetails: {
                suggestedSeniorEditors = [],
                opposedSeniorEditors = [],
                suggestedReviewingEditors = [],
                opposedReviewingEditors = [],
            },
        } = this.submission;
        const editorIds = suggestedSeniorEditors
            .concat(opposedSeniorEditors)
            .concat(suggestedReviewingEditors)
            .concat(opposedReviewingEditors);

        this.editors = (await Promise.all(editorIds.map(async id => await this.getPerson(id)))).filter(
            person => person !== null,
        ) as Person[];
        this.affiliations = this.editors.map(editor => editor.affiliations || '');

        if (this.submission.author) {
            this.affiliations.push(this.submission.author?.aff);
        }
    }

    _getAffiliationId(affiliation: string): string {
        return `aff${this.affiliations.indexOf(affiliation)}`;
    }

    _getEditor(id: string): Person | null {
        return this.editors.find(editor => editor.id === id) || null;
    }

    _articleIdXml(): {} {
        return {
            '@pub-id-type': 'manuscript',
            '#text': this.submission.id,
        };
    }

    _articleCategoriesXml(): {} {
        return {
            'subj-group': ([] as object[]).concat(
                {
                    '@subj-group-type': 'article_type',
                    subject: articleTypeMap[this.submission.articleType],
                },
                (this.submission.manuscriptDetails.subjects || []).map(subject => ({
                    'subj-group': {
                        '@subj-group-type': 'subject_areas',
                        subject: majorSubjectAreas[subject],
                    },
                })),
            ),
        };
    }

    _editorContribXml(editorId: string, contentType: string, contribType: string): {} | null {
        const editor = this._getEditor(editorId);

        if (!editor) {
            return null;
        }

        return {
            '@content-type': contentType,
            contrib: {
                '@contrib-type': contribType,
                xref: {
                    '@ref-type': 'aff',
                    '@rid': this._getAffiliationId(editor.affiliations),
                },
                name: editor.name,
                email: editor.email,
            },
        };
    }

    _affiliationsXml(): object[] {
        return this.affiliations.map((aff, index) => ({
            '@id': `aff${index}`,
            institution: aff,
        }));
    }

    _reviewerContribXml(reviewer: { name: string; email: string }): {} | null {
        const parts = reviewer.name.split(' ');
        const surname = parts.pop();

        return {
            name: {
                'given-names': parts.join(' '),
                surname,
            },
            email: reviewer.email,
        };
    }

    _authorContribXml(): {} {
        return {
            '@content-type': 'authors',
            contrib: {
                '@contrib-type': 'author',
                '@corresp': 'yes',
                name: {
                    surname: this.submission.author?.lastName,
                    'given-names': this.submission.author?.firstName,
                },
                email: this.submission.author?.email,
                xref: {
                    '@ref-type': 'aff',
                    '@rid': this.submission.author ? this._getAffiliationId(this.submission.author.aff) : null,
                },
            },
        };
    }

    _opposedReviewerContribXml(): object[] {
        return (this.submission.editorDetails.opposedReviewers || [])
            .map(reviewer => this._reviewerContribXml(reviewer))
            .filter(item => item !== null) as object[];
    }

    _suggestedReviewerContribXml(): object[] {
        return (this.submission.editorDetails.suggestedReviewers || [])
            .map(reviewer => this._reviewerContribXml(reviewer))
            .filter(item => item !== null) as object[];
    }

    _opposedReviewingEditorsContribXml(): object[] {
        return (this.submission.editorDetails.opposedReviewingEditors || [])
            .map(id => this._editorContribXml(id, 'potential_reviewing_editors', 'opposed_reviewing_editor'))
            .filter(item => item !== null) as object[];
    }

    _suggestedReviewingEditorsContribXml(): object[] {
        return (this.submission.editorDetails.suggestedReviewingEditors || [])
            .map(id => this._editorContribXml(id, 'potential_reviewing_editors', 'suggested_reviewing_editor'))
            .filter(item => item !== null) as object[];
    }

    _opposedSeniorEditorsContribXml(): object[] {
        return (this.submission.editorDetails.opposedSeniorEditors || [])
            .map(id => this._editorContribXml(id, 'potential_senior_editors', 'opposed_senior_editor'))
            .filter(item => item !== null) as object[];
    }

    _suggestedSeniorEditorsContribXml(): object[] {
        return (this.submission.editorDetails.suggestedSeniorEditors || [])
            .map(id => this._editorContribXml(id, 'potential_senior_editors', 'suggested_senior_editor'))
            .filter(item => item !== null) as object[];
    }

    _contribGroupXml(): object[] {
        return [
            this._authorContribXml(),
            ...this._suggestedSeniorEditorsContribXml(),
            ...this._opposedSeniorEditorsContribXml(),
            ...this._suggestedReviewingEditorsContribXml(),
            ...this._opposedReviewingEditorsContribXml(),
            ...this._suggestedReviewerContribXml(),
            ...this._opposedReviewerContribXml(),
        ];
    }

    _relatedArticleXml(): object[] {
        return (this.submission.manuscriptDetails.cosubmission || []).map(title => ({
            '@related-article-type': 'companion',
            'article-title': title,
        }));
    }

    _customMetaGroupXml(): object {
        const { editorDetails, manuscriptDetails, createdBy } = this.submission;
        return {
            'custom-meta': Object.entries({
                'opposed-senior-editor-comment': editorDetails.opposedSeniorEditorsReason,
                'opposed-reviewing-editor-comment': editorDetails.opposedReviewingEditorsReason,
                'opposed-reviewer-comment': editorDetails.opposedReviewersReason,
                'previously-discussed': manuscriptDetails.previouslyDiscussed,
                'previously-submitted': manuscriptDetails.previouslySubmitted,
                'created-by': createdBy,
            })
                .filter(([, value]) => value)
                .map(([name, value]) => ({ 'meta-name': name, 'meta-value': value })),
        };
    }

    _frontXml(): {} {
        return {
            'journal-meta': {
                'journal-id': [{ '@journal-id-type': 'pmc' }, { '@journal-id-type': 'publisher' }],
                issn: {},
                publisher: {
                    'publisher-name': {},
                },
            },
            'article-meta': {
                'article-id': this._articleIdXml(),
                'article-categories': this._articleCategoriesXml(),
                'title-group': {
                    'article-title': this.submission.manuscriptDetails.title,
                },
                'contrib-group': this._contribGroupXml(),
                aff: this._affiliationsXml(),
                'author-notes': { fn: { p: {} } },
                'pub-date': { day: '', month: '', year: '' },
                'related-article': this._relatedArticleXml(),
                'custom-meta-group': this._customMetaGroupXml(),
            },
        };
    }

    async execute(): Promise<string> {
        await this._prepare();
        console.log(this.affiliations);
        const front = this._frontXml();

        return xmlbuilder
            .create(
                { article: { front: front } },
                { version: '1.0', encoding: 'UTF-8' },
                { sysID: 'JATS-journalpublishing1.dtd' },
            )
            .end({ pretty: true });

        return '';
    }
}
