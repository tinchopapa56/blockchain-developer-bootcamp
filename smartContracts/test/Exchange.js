const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Exchange', () => {
    let deployer, feeAccount, exchange, token1, token2;
    const feePercent = 10

    beforeEach(async () => {
        const Exchange = await ethers.getContractFactory("Exchange")
        const Token = await ethers.getContractFactory("Token")
        token1 = await Token.deploy("Dapp University", "DAPP", "1000000")
        // token2 = await Token.deploy("Dapp University s2", "DAPP2", "2000000")

        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]

        //trasnfer tokens to user =>
        let tx = await token1.connect(deployer).transfer(user1.address, tokens(100))
        await tx.wait()

        exchange = await Exchange.deploy(feeAccount.address, feePercent)
    })

    describe('Deployment', () => {

        it("tracks fee account", async () => {
            expect(await exchange.feeAccount()).to.equal(feeAccount.address)
        })
        it("tracks fee percent", async () => {
            expect(await exchange.feePercent()).to.equal(feePercent)
        })
    })

    describe("Deposit Tokens", () => {
        let tx, res, amount = tokens(100);

        describe("Success", () => {

            beforeEach(async () => {
                // console.log("debug TEST_file",user1.address,exchange.address,amount.toString())

                //approve 
                tx = await token1.connect(user1).approve(exchange.address, amount)
                res = await tx.wait()
                //depost
                tx = await exchange.connect(user1).depositToken(token1.address, amount)
                res = await tx.wait()
            })

            it("tracks the token deposit", async () => {
                expect(await token1.balanceOf(exchange.address)).to.equal(amount)
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
            })
            it("emits deposit event", async () => {
                const event = res.events[1]
                expect(event.event).to.equal("Deposit")

                const args = event.args
                expect(args.token).to.equal(token1.address)
                expect(args.user).to.equal(user1.address)
                expect(args.amount).to.equal(amount)
                expect(args.balance).to.equal(amount)
            })
        })
        describe("Failure", () => {
            it("fails when no tokens approved ", async () => {
                const tx_to_fail = exchange.connect(user1).depositToken(token1.address, amount)
                expect(tx_to_fail).to.be.reverted;
                expect(tx_to_fail).to.be.revertedWith("token approval failed");
            })
        })
    })
})
