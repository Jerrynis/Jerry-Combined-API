// ============================================================
// BA Random Image Handler
//  · 官方图 (ba随机官方图): 图片仓库（jsdmirror 主源 / R2 回源），接口保持不变
//  · 壁纸   (ba随机壁纸):   同一仓库，横屏/竖屏壁纸
// 两个端点都由 Worker 直出图片字节，不再 302 跳转到图床域名。
// ============================================================

import { jsonResponse, errorResponse, pickFromPool, resolveOrientation, type Orientation } from '../shared';
import { servePic, selfUrl } from '../picstore';
import { BA_WALLPAPERS } from './wallpapers';
import { BA_WALLPAPERS_PORTRAIT } from './wallpapers-portrait';


// ── 官方图（ba随机官方图）── 仓库相对路径 official/<uuid>.webp
const BA_IMAGES: string[] = `
official/00d2da8e-511e-4b69-acf5-be32da072ae6.webp
official/013f5309-28b2-449d-a67e-74f62e721b86.webp
official/021c0839-7311-4538-a277-ec49dfb611a5.webp
official/028aa8d3-9e0a-47ea-9721-20b770c5ff26.webp
official/039d87e1-4bb8-423c-9103-97bfb7fd3f3a.webp
official/03a3511b-c647-4810-b2f8-10aeb5855601.webp
official/0489243d-e143-4ddf-af6f-56541005b371.webp
official/0503588d-6b91-4da2-aff1-aeb212d6d85e.webp
official/0529a2ce-174b-45b4-bb8f-61cf171b3db4.webp
official/05470b2c-6a57-411c-a85b-ed82be7e9b8d.webp
official/0561e9cb-8b0a-4d9c-bca5-5321c8ed445a.webp
official/0664d789-2a64-4ec2-9d6e-d99aeed9306e.webp
official/0682e121-4613-48c6-8425-c03e977c8c79.webp
official/07501530-7e9d-4be9-ad59-b9f4c665b417.webp
official/07742cb0-fa73-42c5-af3a-a9e116f6d545.webp
official/07b7077e-7a78-4e2c-a0a5-29ffa76ca516.webp
official/08475885-5d67-4ede-bdfa-32392ae59cee.webp
official/0933f48d-22af-4554-9264-a47401bbb392.webp
official/093f0dd6-1d2d-47ee-9692-aeaa457c49ce.webp
official/0adc3415-881d-40a1-8a25-5cbe076dc466.webp
official/0b175f03-472c-444f-a71c-2039d9c95f63.webp
official/0b437e07-5317-42e3-bc07-2a7d07662306.webp
official/0bcaf5fc-f520-4b9b-8e30-f490e8a09f2c.webp
official/0c472a03-8255-4aca-9038-a02c9be7766c.webp
official/0d586a4c-3998-4385-961c-5357d6701a3d.webp
official/0d661626-f3e5-43d0-acdd-da387eeeece2.webp
official/0ed0e168-5f0f-47ae-84ef-434246f5b15c.webp
official/0ee54156-f16a-4b7f-ba54-da520f7d4e67.webp
official/0ef099d8-5c09-4d8f-82f9-725e7e236886.webp
official/0fc7037e-8f10-4bba-a7c3-f68e76b2f757.webp
official/10368a0b-a119-4059-aade-39d794b495d9.webp
official/10c89f48-6763-46a7-9789-7d5b5e0b5736.webp
official/1162baf0-3d75-46ba-8e18-047309420c16.webp
official/117cd398-04e5-42f6-ad4d-deec6f175e2b.webp
official/12418609-8ff3-4426-b486-262ec1140eed.webp
official/12a210d7-ad85-4f5a-9a52-7d998a72f0f6.webp
official/13c4a223-cdf1-47ca-9de0-ac6b4ddca574.webp
official/14134664-1a86-45b6-ac3d-d8c0e10582d0.webp
official/15d72eb6-3b92-4656-82a5-3fb0ff4a19ee.webp
official/1630d03e-5f20-4b0f-b03e-1fa5f56ce593.webp
official/16f15f28-305c-4702-b113-79c234312ff2.webp
official/1742ef77-e13e-4427-8a1d-a261abb14234.webp
official/183017dd-c345-4846-93c5-460e88120ebe.webp
official/1b8bb97a-3fe0-4d39-b3a9-0942e43f2917.webp
official/1ba95aa1-7597-4b9e-acd0-17d019de00d9.webp
official/1bf5b432-bdca-4ebe-be92-b6a23d19439f.webp
official/1c29372c-bbce-490f-9a3b-c0a4c15459c6.webp
official/1c7a84fe-44eb-4445-baa2-8f3a43387a16.webp
official/1c8c6c77-f340-48a9-815b-d8410fa5a646.webp
official/1d941154-f012-4490-a80e-6638b603840f.webp
official/1de7a269-8915-4cc9-b0b4-f13078fba06f.webp
official/1deebf8e-e80a-448b-9cd2-df2389846862.webp
official/1ec80418-84d8-46d4-bb04-de363ce87c8f.webp
official/1fa464d1-5d82-4b42-a088-69f5dd38fc22.webp
official/20ce478f-f981-4121-a4ab-c95a2e54b6c1.webp
official/24026c45-ff18-4421-87a0-940974d527a6.webp
official/243e8596-5cc2-461e-9e61-228a1208a860.webp
official/24c0ed56-420f-402e-bbb3-c80e3c142c24.webp
official/24fb8423-3f02-425b-ab90-8ccecbb876c4.webp
official/259f83be-9dde-40fc-a9e1-8190f32fbfda.webp
official/25acf189-3d93-4b23-b572-02cfac6b5df5.webp
official/25f7f842-3fad-4715-b4bf-07ac20ff45f8.webp
official/26b860a8-c736-4c7d-82ca-531989b9df6d.webp
official/281a0f62-8250-4f73-b9df-2d8f0d7a572f.webp
official/289c4797-4de0-4456-8817-46b016dd150c.webp
official/28a86dd0-1f6c-43a9-b02c-79d9c0b03b59.webp
official/28b44fb8-3a56-4144-a290-46d3842c4212.webp
official/2c907bc0-638c-4f11-9bd9-dc77f36ecd3b.webp
official/2cbce1a8-19e3-4b2d-9680-ce6b038a30cc.webp
official/2d123f99-33ef-437b-a071-0f9ccbbef7af.webp
official/2d72a127-e558-4465-a31d-47b3dd746ab6.webp
official/2e01ed3b-38d5-41ff-ac8b-bcffb67ed0d2.webp
official/300b217c-456d-4c07-ba54-353f53570eeb.webp
official/316bf5a4-5f30-4569-b156-da4933aa6362.webp
official/3177f1fb-b385-415e-8086-72e487d1beb0.webp
official/3285bf56-4f17-4eaa-b542-27470bc53701.webp
official/334ef455-f16f-401f-8584-31ea20305280.webp
official/3360c45f-d506-45e9-9362-eee5692a6396.webp
official/34078197-ce2f-42d4-add2-518191b1b368.webp
official/350175e1-0f6d-4368-8489-d8abdf3ab165.webp
official/352a5c04-d274-4f26-9052-08737034fb7d.webp
official/352a7346-a859-4ebf-9961-199d94d434da.webp
official/35763a33-5233-4f0b-8449-291699e5c775.webp
official/370aa397-cfda-44d2-b47a-a1bc8f473cb4.webp
official/3734e0c5-2aa1-4d77-aa8e-b4aba4e8ab37.webp
official/37660566-52fc-4b0f-8fe0-8f014e24472a.webp
official/3783afc9-e0f7-42f5-b402-2ab460ab49ac.webp
official/37c777b6-b199-419f-aec6-018f7b4f6df0.webp
official/3d2cc8e2-8012-4ca4-9106-673f59f82ff7.webp
official/3e15e0a6-d9c2-4b45-ac98-6ae900e1c6f4.webp
official/3e5912a2-9b6e-495f-af98-96c6c36542b1.webp
official/3e650b2b-6fcd-461a-8238-747db73861c7.webp
official/40444c81-77e3-4f29-a9fd-fa76c759ff88.webp
official/40f893dd-ea4e-4671-8449-e3382575dc86.webp
official/42428b18-cc81-4b3e-84fe-dcfdbf13bca2.webp
official/42dda170-59fa-409d-b2df-e841c51b3463.webp
official/457d0ce2-9f72-4762-a213-5c5ba5453e96.webp
official/461a4d40-8f1f-49b1-a579-7c7838f56b98.webp
official/46a97269-e621-4818-9eaa-64ce429fe014.webp
official/46b47973-455a-4e04-8e32-3273a2be31ff.webp
official/4763003d-89f0-458b-b705-71b70193bfa7.webp
official/48a13a73-5171-4ff6-b33f-a3eca15940e3.webp
official/49ace81a-8a17-498e-b8fe-25cb648b65d1.webp
official/49c214b3-ad0e-4dfe-a823-bf88cdbf2b16.webp
official/49fe2967-35b5-4650-b41c-7b8914e778f0.webp
official/4a320177-be24-4e81-b9fa-e64a062b0e23.webp
official/4d8f6c9c-d8ac-46cf-992e-be98fe7866db.webp
official/4db1bed2-029d-4fdb-b2bd-1a3e02c3410e.webp
official/4df5fc7b-725e-415a-b35d-47b1993b7564.webp
official/4e410b68-495b-4ae2-9b37-96c75bc28d23.webp
official/4eddf87b-8565-453d-922e-f729e6ee825d.webp
official/51162834-cb88-4297-90e0-e4251e5dd8a6.webp
official/51b7bfee-697e-4823-9a10-490a974f687d.webp
official/51db483f-e2f3-4a28-b0a5-7517360b0aa0.webp
official/528150c0-afff-4b29-93e3-c446171afe19.webp
official/52fe7204-af2c-4234-8215-4e7d5065337e.webp
official/5356d1f2-3c53-4707-8960-7bc56cfe1da4.webp
official/547bccdf-f9ce-4eae-84d9-af4a38bb8c6b.webp
official/54ba8b19-de23-43b3-a175-452ddfec697c.webp
official/54fd6137-1918-4555-9812-6a4260c7a631.webp
official/55934785-1cda-47d6-a64b-694d2a556551.webp
official/55f6a9d2-7e0c-4700-8969-001c30218d07.webp
official/561d6ea7-a4b8-4886-945c-3cbaf33de98a.webp
official/565e6ad0-b1ab-4fcc-a0f0-8c44bf0300a4.webp
official/5685c0c4-dd21-4843-a02c-d8bff1d64ec9.webp
official/57265cf3-234d-4308-967a-85099638785e.webp
official/572f4092-af16-4fa7-83d2-748cf9f400e8.webp
official/57957fb0-1430-4fba-8dc7-0dcea3485679.webp
official/59188f15-99e9-43a0-b858-f82066538889.webp
official/59c74222-15d7-45a0-8957-0e052c2425fe.webp
official/5a5b0b34-2855-4a33-9b75-1651dbaacaa2.webp
official/5a602941-2e86-4eb6-943a-3a551b755e05.webp
official/5aa6224e-2b0f-4336-8070-0dc06e91f441.webp
official/5b6b8be9-27db-4e6d-99f3-a34b05028eec.webp
official/5c5fcffc-2f69-4395-9285-a28f140f1e11.webp
official/5c9ffb8a-94e1-4d2a-844a-70aa2a614b52.webp
official/5cfc0403-3fc2-41c2-8e1d-5b1254cda03b.webp
official/5d6ce737-7223-42ee-b7b1-eaea264c7212.webp
official/5d9a55ec-bebf-4de4-8a67-8a4d14961b7b.webp
official/5e08a069-c83f-40b5-b76b-92d6ed2c90ff.webp
official/5f8e5eec-ff80-4ee1-905a-195e85e697bd.webp
official/5ff91b5e-1f9b-4e25-bdb6-de56a7918d7e.webp
official/61eb2391-ee74-453b-b368-5a57424d6479.webp
official/628ea479-e174-4409-87ac-e7c4d0ad70f4.webp
official/62bac3fb-062b-4923-8dca-c5a2769d697a.webp
official/635e7ad5-b712-425b-bc30-1978367dab17.webp
official/643c08c0-db86-4f37-99fb-2b482f59243c.webp
official/649a33b5-7de5-47d1-87e8-0b0bf98f447d.webp
official/64a2aed0-2991-4607-b2b7-9d863a549c22.webp
official/665042ef-a1f3-45a7-af3d-0b61949601c7.webp
official/66bab407-ee17-4135-9d84-8db30c19cd45.webp
official/66ce52a2-4c51-4e9d-af71-db99ba563d3c.webp
official/67ca7999-b254-4528-8a81-6fa3dc6d5acb.webp
official/689fe221-e293-4aa0-9ad0-c71796590a9a.webp
official/69607df9-0515-4a1a-a891-8a1ad6d8bc75.webp
official/6966c773-8735-4100-a7d4-b111760fd2e6.webp
official/69cdc06b-0b6f-4bfa-8c3c-ea82d1692b4d.webp
official/6a4f168b-8b7a-499c-bca6-c43ab44d9fdf.webp
official/6a89221e-d97c-42bf-b009-897473d3e0bc.webp
official/6b3d8780-cab9-4a03-aa63-f107fbf95ac7.webp
official/6b649cab-9e79-4462-8fce-3e987de21915.webp
official/6c4e70d1-8e42-43fc-8306-68be3d80b3a4.webp
official/6d9c07a0-46e5-4831-b2bd-cdc38e5cbff3.webp
official/6e104a2f-a59d-45d1-a247-0f0fd5b23587.webp
official/6e7a8e42-7d82-47da-83d8-da484a23d3f6.webp
official/6f3388a0-ebcd-42c2-bc5d-b8e69d999ddd.webp
official/6fba4384-d5a6-48a0-9e87-62270d94598c.webp
official/6ff783c1-e270-43b8-af02-d2f74cd64e54.webp
official/70ed030f-6344-4656-b783-a615ea14cdbf.webp
official/720b3aa5-423b-4846-879c-410c101991c6.webp
official/72738126-addc-46ec-bf94-d92ed4fcdee3.webp
official/73f6ace8-1b5e-47c4-9acd-4e2a9323d5d0.webp
official/74955ca0-6c54-4fa3-a634-230f5cd2e25a.webp
official/74af5308-4a48-4b71-b3b8-840e04d472bf.webp
official/74dfb237-b7f0-46a6-ba99-d46bde524708.webp
official/7534c32c-8754-4745-b15d-b2058548d022.webp
official/753534c3-942a-4bbe-9962-93e777c4f36e.webp
official/75aa9c84-e51c-4ce1-9e92-1318bb7f0ca7.webp
official/7649f6c9-641a-4f8a-9e75-c4913a8d0b2e.webp
official/76e7876b-3553-46e3-8626-0d103bf5e3c3.webp
official/7928c531-8ada-4067-aa6c-a77f44be2f26.webp
official/7a04b920-c5f0-4d6e-961d-6ef7e5a982ed.webp
official/7b5200a1-58a7-4cea-ba53-678e522419e5.webp
official/7c05d8c4-26d5-41cf-94fb-97e40ea12151.webp
official/7c461b3a-128a-424f-a630-9bbf3cada21a.webp
official/7c50f0ae-14df-4a26-a698-7c4bd6f49095.webp
official/7de84542-2262-421e-a45a-297fd9850699.webp
official/7e379335-f1e9-44fd-baf6-f7ccf74259ad.webp
official/7e386bb1-2585-4fa9-90bc-586ebecea945.webp
official/7eb9fc4f-a41e-4191-9baa-32efe98da2d4.webp
official/7f76d8c7-14e1-4753-82c1-daec01ebd34b.webp
official/7fdd471c-00ff-49c4-baf9-502f0c1d84ab.webp
official/80942f2a-68a2-463f-9620-952e34557f0f.webp
official/819555b9-d10a-48be-ac48-b16e89c65e3f.webp
official/81c65eac-d9de-4080-a634-d1d5185ba96d.webp
official/81d998e7-841d-4c91-b9a7-d641d8ecbd04.webp
official/82a2c9e1-5b9f-422b-815b-9e457bc03da7.webp
official/8395d841-6af5-4bb4-92d3-24d95c618349.webp
official/86f871d7-c4e6-45bd-97bf-790bfd2bab13.webp
official/873c335a-ebb5-40d0-9f97-d694763317f9.webp
official/886354c3-fbae-424d-845a-b37fd9bd7a1a.webp
official/8b55f05b-39b3-4897-88dc-7eaeeb6f605a.webp
official/8bf8964d-eeb1-45d5-8e2a-b9fe20ff8533.webp
official/8c9f5d3e-f95c-4cc8-8a67-c4206933d512.webp
official/8d476970-9c0e-43fa-91a7-b10defb316a6.webp
official/8e1d45df-2b34-42fe-82db-055382723cf9.webp
official/90de4cb4-9df4-484d-87d5-84d71c233436.webp
official/912d583a-7729-4b62-9eec-39d3930f2516.webp
official/9199919d-08b0-463a-bc4e-1c049fd98bff.webp
official/9282ed29-5c54-4075-8f42-5bf139bcd836.webp
official/93241ec2-676b-4a14-af41-f152892463fd.webp
official/945822f8-5a35-4942-952f-fc668fad34a9.webp
official/94c1dd38-f8b4-474b-bf03-fdccb0e7d6ce.webp
official/95e6058b-5c55-4f79-a696-629a8961fde5.webp
official/97b83028-708a-4cab-9dd1-445df2dce4bf.webp
official/98a618be-128b-41a9-88b0-774eedc2ded5.webp
official/98c6bfb6-7969-4783-98eb-67689ebdc4c4.webp
official/9951b9b7-990d-4a5a-bb61-9fc126c9b644.webp
official/99bb0ffe-6780-405b-9e0f-8047ecc18221.webp
official/99c369aa-d02d-4b07-bbf2-c3538ad0264a.webp
official/99d6f1e2-04c3-4890-b905-6bc781300dc5.webp
official/9adf1687-5e8e-4c0e-9dbc-c50e714a2c74.webp
official/9c32ff75-be5d-448f-96c5-9ec7e08ff156.webp
official/9da0acd9-621f-42dc-b9ad-a64d40a6b377.webp
official/9ddca12a-1eb7-421b-b57e-7b53d5a022a6.webp
official/9de2379d-597c-4d9b-9375-b4bc6227f651.webp
official/9f434e77-96cd-4fd5-bf1f-3b0e28036517.webp
official/9fb319fb-48f3-4116-a501-8ee76fe1f602.webp
official/a12ce0cf-2452-48ab-a16f-60136ef26724.webp
official/a1306291-b4a5-4bc6-b7aa-1548d921db53.webp
official/a1b742a5-06d2-4b94-a811-5ab5e8d6b2b7.webp
official/a2a8363a-ef48-4513-b0a3-7313a62c42eb.webp
official/a2a83cfd-acd0-48ce-9b12-ce47e99bae50.webp
official/a3fce402-3312-4470-8971-4cb7b03b6161.webp
official/a46b158e-5446-4283-beb3-61880e78cb48.webp
official/a4b27e82-ce89-4247-883b-88f44d965720.webp
official/a4c0516e-8768-4ed6-b4f8-6302e3d31473.webp
official/a654251a-c4ee-44a1-a482-154cdc5324b6.webp
official/a657b5de-6751-458f-b0ad-4ffd51bbcb11.webp
official/a6aed72b-6546-4566-aeab-cc0cba138581.webp
official/a6eb5075-e129-45af-af73-c92fcd699cc9.webp
official/a758f1be-1718-4167-9f85-ddb00d4e3aca.webp
official/a843b00c-d425-461d-950e-ce7ff41bd9e7.webp
official/aa0b2d8d-34d7-4f71-9dac-564436966d77.webp
official/aaf847ac-6fa1-4328-9bee-617793027333.webp
official/ab38c020-5122-4d30-a23e-454b109c41a5.webp
official/abace530-bbe5-43d8-82ef-a7ca20bed451.webp
official/abd06650-0c51-47e1-aff3-5edbd9a1a301.webp
official/ae44119d-6866-4089-8874-48140b2d3d45.webp
official/ae55a126-5fc9-498f-95c7-0b023ea7c755.webp
official/ae714e9a-08d8-4129-aea8-bb3865f9540b.webp
official/afd1e859-ff6a-4843-b067-009b81d752c0.webp
official/b10f69ca-cfec-4466-bf13-e2495fe536a0.webp
official/b20b7560-4fb3-4cdb-a923-a6efe6d847eb.webp
official/b20bd57c-8e72-4348-921a-1473ddd29f84.webp
official/b2d6b656-c85c-45e8-aca3-2c55f11e8e0a.webp
official/b3701930-34bd-490a-ad8a-398c914fe252.webp
official/b3c5ad0e-4bda-4bd0-b22a-7db5f4d7d276.webp
official/b514a688-484e-42ca-b266-5ffc15922cb8.webp
official/b5df6fe0-bb70-41e5-9984-94573138c411.webp
official/b6aa2147-4f1f-492a-be89-d20e27071649.webp
official/b871ebff-a787-4f58-b90a-85ab2a4f8816.webp
official/b8dae4a0-250e-4c25-8e6d-ac52f9711118.webp
official/b9d86478-180e-4bbf-9ccc-6d80fe95eee2.webp
official/bb9dd61e-7a78-4cf0-828e-9c47fe2e4b0e.webp
official/bccaf5e7-3bb1-4a3e-8a82-1fac72bcc40c.webp
official/bcdaea05-2138-4adb-bb5f-73e100cea62e.webp
official/bcdc960b-b80b-4ed5-8e25-393cdb41661c.webp
official/bcfaafd0-b871-4271-9bbd-a6e483f22182.webp
official/bd6a3bf2-d271-47d2-a1be-8f097823fac4.webp
official/befef9f2-b6ad-4218-b188-a96a4d1f1697.webp
official/bf086cfe-f3b5-4034-b765-1f65c107e33b.webp
official/bf0d2490-98c1-44c5-bb86-c5c656e17424.webp
official/bf4f0acb-a614-4dd9-a88f-9710edd20851.webp
official/bff45525-71cc-4e46-b080-90faf55a6cdd.webp
official/c43b9ba0-5104-4497-8b2f-981aa99bd837.webp
official/c4bdae52-50d2-49a1-b1e3-6d7d590e2a03.webp
official/c501ee13-2964-42f7-96ac-a0f3211bbe22.webp
official/c5479144-1663-4ccd-8412-7bbabdb73254.webp
official/c5ab23f7-f542-4b38-9830-58942c3451b4.webp
official/c5c25ca3-9d64-4e29-b837-42b1ee5c42e8.webp
official/c651d6e5-63fd-41ff-b8c2-28178b88741f.webp
official/c6f116f6-cbf5-46ed-9767-b7ab4922fe43.webp
official/c7514e10-8989-4d86-902a-00ab5f1d99fe.webp
official/c7553943-9ddf-4614-a65f-b50fa00847cd.webp
official/c7bf6470-94d0-40dc-a70f-89b898de2cfb.webp
official/c8ae93ec-0b32-4ec5-b5a2-a6da0c8499b7.webp
official/c8b48d1d-fc3b-4a99-aac9-35f2845a862d.webp
official/c93b0be3-7e03-4eba-a3e6-3ca5f1ddf592.webp
official/c9d3a454-3348-4a63-806d-b399fda1036a.webp
official/c9fb1bc9-98b1-4fe0-947e-ffaf7137e92c.webp
official/ca840a65-74d7-4ba7-bd03-e30d9a57dee9.webp
official/caacc5ca-b9f8-482e-96aa-29a1a655d692.webp
official/cb2a5bd2-d8bd-4053-bb2c-11b46f280da4.webp
official/cb4bfe3c-fc1b-49cd-8c93-af75914d97a5.webp
official/cc01f6e7-b4bf-41cc-8643-cc2dfb439fe4.webp
official/cc0d3d1a-8805-4f3a-bbab-c8a6a13a64fd.webp
official/cc25e587-fcbc-487b-958d-af5ffd492ef3.webp
official/ccd447d4-1226-49a0-928a-69148978a898.webp
official/cea6a69b-c5b4-4120-9e7c-a6c4707ab20b.webp
official/cebf6e77-8e98-4fbb-a641-1293c50a3b54.webp
official/d03e7f5a-ef20-4f0d-b017-71b8c0f46eb9.webp
official/d0803f16-953b-4602-8706-0e52b3cd0774.webp
official/d20e32f4-e9b2-4f36-80d5-501c6f1d0783.webp
official/d2b84e39-8666-4e04-b3e1-55654c96d93b.webp
official/d3147d68-6e9f-4932-9655-57e6cdd7e16c.webp
official/d51af9ee-1275-493a-b902-9b6c085d3ee0.webp
official/d5b1dad6-0e93-4a8a-a37f-e2f50d5e5efe.webp
official/d5d1a8f7-1f44-4646-a6ee-84e10eb56540.webp
official/d7775d83-4ebe-48ea-a913-8f9d5480516b.webp
official/d85b15cf-c02f-482e-a519-1def1cfe7afe.webp
official/d9f3314b-3245-4049-b213-b7f2b043aeed.webp
official/da3eba76-7608-4939-bf60-c72b90524634.webp
official/dac1ab68-4a9c-41fa-be5b-5d150f47930c.webp
official/db037a4f-9adc-4710-a20f-aa49d260a1e4.webp
official/dd76020c-7c03-47fb-9bcf-bd201f046219.webp
official/dd883cb8-5d69-4a69-a133-eb3a94530637.webp
official/ddeb9418-0e00-4341-bd80-471e3cc5611d.webp
official/de0e9b20-d95b-44d5-97d1-62d84e1227b3.webp
official/de23b5ef-7067-41ad-b0e7-c8395000ce1e.webp
official/de38f5a6-a90d-41eb-bce8-170fc214462c.webp
official/de4a6d33-64af-4cdd-bb19-9705d1189e27.webp
official/df056e95-aaf3-460e-88f7-c721f41efae3.webp
official/e09f89f3-a280-41c3-a957-d8471cc55566.webp
official/e14b7789-a28d-4f1b-ab04-5168f9397e11.webp
official/e26530e2-6c45-4d71-8ca3-48cff2d41509.webp
official/e26d2ad7-eb23-4212-9a5c-c85d6733e63a.webp
official/e4190ae3-f54c-4d6d-99f9-bab0ffc44b6d.webp
official/e7b59fc9-6ed4-415f-a393-dd6b7cd49f0f.webp
official/e8ad5668-1f87-43b4-9c3e-6991958237d4.webp
official/e910693c-1a83-4b90-931a-7aa9675051bc.webp
official/e947fd5f-a9a0-4a2f-8cee-58207fc40b8d.webp
official/ea1a8013-6918-44dd-b11b-1d8742a10ea4.webp
official/ea2449a9-9ad1-456d-93ef-ba887d8eb234.webp
official/eb8bc2f3-467c-493b-986f-263eed888358.webp
official/ebdc67ae-ce13-4719-9543-580f00300f71.webp
official/ecbe3416-a09d-4ebd-abb1-9143dbf19874.webp
official/ed3b2d5b-1a39-4a76-aae1-d23940166604.webp
official/efc66927-8a07-4573-bfd8-59b992cd45b4.webp
official/f0210a85-398a-4b64-88ee-20fa6885049b.webp
official/f166031f-e9ca-4a2a-a9aa-4fd650e6b55f.webp
official/f268b9cf-3e54-4058-965f-20f39deaf768.webp
official/f4a281f9-0b77-43bf-ba72-f66c43ea88d7.webp
official/f4e0b922-22d0-49e0-b359-6644e5b761ec.webp
official/f51fa162-ccc0-4d59-b434-5415cad24a83.webp
official/f64f5e99-c2cc-44dc-a2f5-3fca4059db14.webp
official/f6936422-4842-4819-b36a-b50cb5ee8309.webp
official/f78662cf-26a3-47d9-8ccb-0537f202c0bb.webp
official/f8a129ce-1045-4202-8cf3-83900e812416.webp
official/f8b56ad8-260c-4350-bb6c-40566e1d7bf7.webp
official/f8bb6b9d-fe62-4949-913f-e61296ca3539.webp
official/f9100eae-e3f4-4f70-9b65-f43ce499e042.webp
official/f93e5539-94f4-49c2-ab6b-e6ac4a18ed01.webp
official/fb6e431f-dbbd-485f-95f2-ac31e9e05db8.webp
official/fc6c3a5b-2129-4721-8076-bc92c0f6ecc0.webp
official/fcb7f1ba-d917-4fa3-b6ad-4fbcc12b8e88.webp
official/fd8f589a-9284-4cf2-b778-c600fa555931.webp
official/fed09364-aaf1-42ec-a92b-99e3ffd53cbc.webp
official/ff13dad1-8b29-4440-b922-e0055e910dbe.webp
official/ff80df7c-eb65-4e05-b7cb-e6b238be8f09.webp
`.split(String.fromCharCode(10)).filter(Boolean);


// seed 存在时按 seed 稳定挑图；否则随机。返回仓库相对路径。
function getRandomImagePic(seed?: string): string {
  return pickFromPool(BA_IMAGES, seed);
}

// ── 壁纸（ba随机壁纸）── 横屏 1042 张 / 竖屏 501 张。
function pickWallpaperPic(key: Orientation, seed?: string): string {
  return pickFromPool(key === 'landscape' ? BA_WALLPAPERS : BA_WALLPAPERS_PORTRAIT, seed);
}

export async function handleBa(request: Request, url: URL, env: any, ctx: ExecutionContext): Promise<Response> {
  const subPath = url.pathname.replace(/^\/ba\/?/, '').toLowerCase();
  const orientation = url.searchParams.get('orientation');
  // 时间戳种子：提供 t 或 ts 时，同一值固定返回同一张图；缺省则随机
  const seed = url.searchParams.get('t') || url.searchParams.get('ts');

  // ── ba随机官方图（Worker 直出图片字节）──
  if (subPath === 'random' || subPath === 'ba' || subPath === '') {
    return servePic(getRandomImagePic(seed || undefined), ctx);
  }
  if (subPath === 'json') {
    return jsonResponse({
      code: 200,
      message: 'success',
      url: selfUrl(request, '/ba/random', ['t', 'ts']),
      type: 'image',
    });
  }


  // ── ba随机壁纸（默认按设备自动适配横竖屏，可用 orientation=landscape|portrait 强制）──
  const oKey = resolveOrientation(orientation, request);
  if (subPath === 'wallpaper' || subPath === 'wallpaper/random') {
    return servePic(pickWallpaperPic(oKey, seed || undefined), ctx);
  }
  if (subPath === 'wallpaper/json') {
    return jsonResponse({
      code: 200,
      message: 'success',
      url: selfUrl(request, '/ba/wallpaper', ['orientation', 't', 'ts']),
      type: 'image',
      orientation: oKey,
    });
  }

  return errorResponse(
    'Unknown BA endpoint: /ba/' + subPath + '. Available: /ba/random, /ba/json, /ba/wallpaper, /ba/wallpaper/json',
    404
  );
}
