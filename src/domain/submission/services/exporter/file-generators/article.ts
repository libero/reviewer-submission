/* eslint-disable @typescript-eslint/camelcase */
import * as xmlbuilder from 'xmlbuilder';
import axios from 'axios';
import Submission, { ArticleType } from '../../models/submission';
import user_api_url from '../../../../../config';

interface Editor {
    id: string;
    email: string;
    name: {
        surname: string;
        'given-names': string;
    };
    affiliations: string;
}

interface Affiliation {
    name: string[];
}

interface ContinuumPerson {
    id: string;
    name: {
        surname: string;
        givenNames: string;
    };
    emailAddresses: { value: string }[];
    affiliations?: Affiliation[];
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

// @todo: this should go in test setup
const existingNames = [{ id: 1, first: 'J. Edward', last: 'Reviewer' }];

// @todo: replace with ejp_name lookup
const splitName = (name: string): { surname: string; givenNames: string } => {
    const existing = existingNames.find(n => `${n.first} ${n.last}` === name);

    if (existing) {
        return {
            surname: existing.last,
            givenNames: existing.first,
        };
    }

    const surname = name.substring(name.indexOf(' ') + 1);
    const givenNames = name.substring(0, name.length - surname.length - 1);

    return { surname, givenNames };
};
class ArticleGenerator {
    private editors: Editor[] = [];
    private affiliations: string[] = [];

    constructor(private readonly submission: Submission) {}

    async getEditor(id: string): Promise<Editor | null> {
        const { data } = await axios.get<ContinuumPerson>(`${user_api_url}/editors/${id}`);

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
                .map((affiliation: Affiliation): string => affiliation.name.join(', '))
                .join(', '),
        };
    }

    async _collectEditorInfo(): Promise<void> {
        const {
            editorDetails: {
                suggestedSeniorEditors = [],
                opposedSeniorEditors = [],
                suggestedReviewingEditors = [],
                opposedReviewingEditors = [],
            },
        } = this.submission;
        const editorIds = [
            ...opposedReviewingEditors,
            ...suggestedSeniorEditors,
            ...opposedSeniorEditors,
            ...suggestedReviewingEditors,
        ];

        suggestedSeniorEditors
            .concat(opposedSeniorEditors)
            .concat(suggestedReviewingEditors)
            .concat(opposedReviewingEditors);

        this.editors = (await Promise.all(editorIds.map(async id => await this.getEditor(id)))).filter(
            person => person !== null,
        ) as Editor[];
        this.affiliations = this.editors.map(editor => editor.affiliations || '');

        if (this.submission.author) {
            this.affiliations.push(this.submission.author.aff);
        }
    }

    _getAffiliationId(affiliation: string): string {
        return `aff${this.affiliations.indexOf(affiliation)}`;
    }

    _getEditor(id: string): Editor | null {
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

    _editorContribXml(editorIds: string[], contribType: string): object[] {
        return editorIds
            .map((editorId: string): object | null => {
                const editor = this._getEditor(editorId);

                if (!editor) {
                    return null;
                }

                return {
                    '@contrib-type': contribType,
                    name: editor.name,
                    email: editor.email,
                    xref: {
                        '@ref-type': 'aff',
                        '@rid': this._getAffiliationId(editor.affiliations),
                    },
                };
            })
            .filter(editor => editor !== null) as object[];
    }

    _affiliationsXml(): object[] {
        return this.affiliations.map((aff, index) => ({
            '@id': `aff${index}`,
            institution: aff,
        }));
    }

    _reviewerContribXml(reviewers: { name: string; email: string }[], contribType: string): object[] {
        return reviewers
            .map((reviewer: { name: string; email: string }): object => {
                const { surname, givenNames } = splitName(reviewer.name);

                return {
                    '@contrib-type': contribType,
                    name: {
                        surname,
                        'given-names': givenNames,
                    },
                    email: reviewer.email,
                };
            })
            .filter(editor => editor !== null) as object[];
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

    _potentialReviewersContribXml(): object {
        const {
            editorDetails: { suggestedReviewers = [], opposedReviewers = [] },
        } = this.submission;

        const contrib = [
            ...this._reviewerContribXml(suggestedReviewers, 'suggested_reviewer'),
            ...this._reviewerContribXml(opposedReviewers, 'opposed_reviewer'),
        ];

        return {
            '@content-type': 'potential_reviewers',
            contrib,
        };
    }

    _potentialReviewingEditorsContribXml(): object {
        const {
            editorDetails: { suggestedReviewingEditors = [], opposedReviewingEditors = [] },
        } = this.submission;

        const contrib = [
            ...this._editorContribXml(suggestedReviewingEditors, 'suggested_reviewing_editor'),
            ...this._editorContribXml(opposedReviewingEditors, 'opposed_reviewing_editor'),
        ];

        return {
            '@content-type': 'potential_reviewing_editors',
            contrib,
        };
    }

    _potentialSeniorEditorsContribXml(): object {
        const {
            editorDetails: { suggestedSeniorEditors = [], opposedSeniorEditors = [] },
        } = this.submission;

        const contrib = [
            ...this._editorContribXml(suggestedSeniorEditors, 'suggested_senior_editor'),
            ...this._editorContribXml(opposedSeniorEditors, 'opposed_senior_editor'),
        ];

        return {
            '@content-type': 'potential_senior_editors',
            contrib,
        };
    }

    _contribGroupXml(): object[] {
        return [
            this._authorContribXml(),
            this._potentialSeniorEditorsContribXml(),
            this._potentialReviewingEditorsContribXml(),
            this._potentialReviewersContribXml(),
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
        await this._collectEditorInfo();
        const front = this._frontXml();

        return xmlbuilder
            .create(
                { article: { front: front } },
                { version: '1.0', encoding: 'UTF-8' },
                { sysID: 'JATS-journalpublishing1.dtd' },
            )
            .end({ pretty: true });
    }
}

export const generateArticle = async (submission: Submission): Promise<string> => {
    return new ArticleGenerator(submission).execute();
};
