import { expect } from 'chai';
import { PactTestSetup } from '../settings/provider.mock';

import * as sinon from 'sinon'

import * as config from 'config'
import { mockReq, mockRes } from 'sinon-express-mock';

import { getAccessManagementServiceAPIOverrides } from '../utils/configOverride';
import { requireReloaded } from '../utils/moduleUtil';

const { Matchers } = require('@pact-foundation/pact');
import { DateTimeMatcher } from '../utils/matchers';
const { somethingLike, iso8601DateTime, term } = Matchers;
const pactSetUp = new PactTestSetup({ provider: 'am_api_getroles_assignments_by_caseid', port: 8000 });

const caseId = "12345";
describe("access management service, query role assignments", () => {

    const roles = [{ roleName: 'lead-judge', roleCategory: 'JUDICIAL' },
    { roleName: 'hearing-judge', roleCategory: 'JUDICIAL' },
    { roleName: 'case-worker', roleCategory: 'LEGAL_OPERATIONS' }];

    const REQUEST_BODY = {
        queryRequests: [
            {
                attributes: {
                    caseId: [caseId],
                    caseType: ['asylum'],
                    jurisdiction: ['IAC'],
                },
                grantType: ['EXCLUDED'],
            },
        ],
    };
    const RESPONSE_BODY = {
        "roleAssignmentResponse": []
    };
    for (const role of roles) {
        const roleAssognmentRole = {
            'id': somethingLike('4d4b6fgh-c91f-433f-92ac-e456ae34f72a'),
            'actorId': somethingLike('5d4b6fgh-c91f-433f-92ac-e456ae34f72a'),
            "roleCategory": role.roleCategory,
            "roleName": role.roleName,
            "created": term(DateTimeMatcher("2022-01-01T16:53:10+0100")),
            "attributes":{
               "notes": somethingLike("test notes") 
            }
        };
        roleAssognmentRole.roleName = role.roleName;
        roleAssognmentRole.roleCategory = role.roleCategory;

        RESPONSE_BODY.roleAssignmentResponse.push(roleAssognmentRole);
    }
    describe("post /am/role-assignments/query", () => {
        let sandbox: sinon.SinonSandbox = sinon.createSandbox();
        let next;

        beforeEach(() => {
            next = sandbox.spy();
        });
        before(async () => {
            await pactSetUp.provider.setup()
            const interaction = {
                state: "returned role assignments for caseId",
                uponReceiving: "query role assignments for caseId",
                withRequest: {
                    method: "POST",
                    path: `/am/role-assignments/query`,
                    headers: {
                        'Authorization': 'Bearer someAuthorizationToken',
                        'ServiceAuthorization': 'Bearer someServiceAuthorizationToken',
                        "content-type": "application/vnd.uk.gov.hmcts.role-assignment-service.post-assignment-query-request+json;charset=UTF-8;version=2.0",
                    },
                    body: REQUEST_BODY,
                },
                willRespondWith: {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: RESPONSE_BODY,
                },
            };

            // @ts-ignore
            pactSetUp.provider.addInteraction(interaction);
           

        })


        afterEach(() => {
            sandbox.restore();
            sinon.reset();
        });


        it("returns the correct response", async () => {
            const configValues = getAccessManagementServiceAPIOverrides(pactSetUp.provider.mockService.baseUrl)
            sandbox.stub(config, 'get').callsFake((prop) => {
                return configValues[prop];
            });

            const { findExclusionsForCaseId } = requireReloaded('../../../../roleAccess/exclusionService');

            const req = mockReq({
                headers: {
                    'Authorization': 'Bearer someAuthorizationToken',
                    'ServiceAuthorization': 'Bearer someServiceAuthorizationToken',
                    'content-type': 'application/json',
                },
                body: {
                    caseId: caseId,
                    jurisdiction: 'IAC',
                    caseType: 'asylum',
                }

            });
            let returnedResponse = null;
            const response = mockRes();
            response.send = (ret) => {
                returnedResponse = ret
            };

            const userInfo = {
                uid: '12345',
                roles: []
            }
            try {
                await findExclusionsForCaseId(req, response, next);

                assertResponses(returnedResponse);
                pactSetUp.provider.verify()
                pactSetUp.provider.finalize()
            } catch (err) {
                console.log(err.stack);
                pactSetUp.provider.verify()
                pactSetUp.provider.finalize()
                throw new Error(err);
            }
        })
    })
})

function assertResponses(dto: any) {

    console.log(JSON.stringify(dto));
    expect(dto[0].actorId).to.be.equal("5d4b6fgh-c91f-433f-92ac-e456ae34f72a");
    expect(dto[0].id).to.be.equal("4d4b6fgh-c91f-433f-92ac-e456ae34f72a");
    expect(dto[0].added).to.be.equal("2022-01-01T16:53:10+0100");
    expect(dto[0].userType).to.be.equal("JUDICIAL");
    expect(dto[0].notes).to.be.equal("test notes");
}


function getDummyCaseRole() {
    return {
        "name": "[PETSOLICITOR]",
        "label": "Petitioner's Solicitor",
        "description": "Petitioner's Solicitor",
        "category": "PROFESSIONAL",
        "substantive": true,
        "patterns": [
            {
                "roleType": {
                    "mandatory": true,
                    "values": [
                        "CASE"
                    ]
                },
                "grantType": {
                    "mandatory": true,
                    "values": [
                        "SPECIFIC"
                    ]
                },
                "classification": {
                    "mandatory": true,
                    "values": [
                        "RESTRICTED"
                    ]
                },
                "attributes": {
                    "jurisdiction": {
                        "mandatory": true
                    },
                    "caseType": {
                        "mandatory": true
                    },
                    "caseId": {
                        "mandatory": true
                    }
                },
                "substantive": false
            }
        ]
    };
}
