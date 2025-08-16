import logging
from operator import itemgetter
from typing import Dict, List

from adh_sample_library_preview import (
    Asset,
    MetadataItem,
    SdsExtrapolationMode,
    SdsInterpolationMode,
    SdsStream,
    SdsType,
    SdsTypeCode,
    SdsTypeProperty,
    TypeReference,
)
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .client import NAMESPACE_ID, get_adh_client
from .model import ML_MODEL_ASSET_TYPE_QUERY, create_ml_asset, create_ml_type

# Constants


# Response Models
class HealthResponse(BaseModel):
    status: str


class StatusResponse(BaseModel):
    status: str


class MessageResponse(BaseModel):
    message: str


class ModelCreateRequest(BaseModel):
    id: str
    name: str
    description: str
    sampling_rate: int
    model_type: str
    past_covariates: List[str]
    target: List[str]
    future_covariates: List[str]
    status: List[str]
    training_horizon: int
    forecast_horizon: int
    update_frequency: int
    retrain_frequency: int


# Initialize FastAPI app
app = FastAPI(title="My API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _split(value: str):
    if value:
        if value == "":
            return []
        return value.split(",")

    return []


def sort_list(l: List, key="name"):
    return sorted(l, key=itemgetter(key))


def extract_simple_fields(data: Dict) -> Dict:
    """Extract common fields from ADH objects with defaults."""
    fields = ["Id", "Name", "Description", "CreatedDate"]
    d = {}
    for key in fields:
        try:
            d[key.lower()] = data[key]
        except:
            d[key.lower()] = ""
    return d


def meta2dict(meta: List[MetadataItem]) -> Dict[str, MetadataItem]:
    d = {}
    for _meta in meta:
        d[_meta.Name] = _meta
    return d


def extract_model_fields(data: Asset) -> Dict:
    """Extract common fields from ADH objects with defaults."""
    try:
        _meta = meta2dict(data.Metadata)
        d = {}
        # convert to lower case for consistency
        d["id"] = getattr(data, "Id", "")
        d["name"] = getattr(data, "Name", "")
        d["description"] = getattr(data, "Description", "")
        d["model_type"] = _meta["model_type"].Value
        d["sampling_rate"] = _meta["sampling_rate"].Value
        d["past_covariates"] = _split(_meta["past_covariates"].Value)
        d["target"] = _split(_meta["target"].Value)
        d["future_covariates"] = _split(_meta["future_covariates"].Value)
        # d["status"] = _meta["status"].Value
        d["training_horizon"] = _meta["training_horizon"].Value
        d["forecast_horizon"] = _meta["forecast_horizon"].Value
        d["update_frequency"] = _meta["update_frequency"].Value
        d["retrain_frequency"] = _meta["retrain_frequency"].Value
        return d
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch models: {str(e)}")
        # Fallback to simple fields if model fields extraction fails
        return extract_simple_fields(
            data.toDictionary() if hasattr(data, "toDictionary") else {}
        )


@app.get("/", response_model=MessageResponse)
async def root():
    return MessageResponse(message="Hello from FastAPI!")


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="healthy")


@app.get("/connect/types")
async def get_types():
    try:
        client = get_adh_client()
        types = client.Types.getTypes(NAMESPACE_ID)
        return sort_list([extract_simple_fields(i.toDictionary()) for i in types])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch types: {str(e)}")


@app.get("/connect/streams")
async def get_streams():
    logging.info("/connect/streams")
    try:
        client = get_adh_client()
        streams = client.Streams.getStreams(NAMESPACE_ID)
        return sort_list([extract_simple_fields(i.toDictionary()) for i in streams])
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch streams: {str(e)}"
        )


@app.get("/connect/assets")
async def get_assets():
    logging.info("/connect/assets")
    try:
        client = get_adh_client()
        assets = client.Assets.getAssets(NAMESPACE_ID)
        return sort_list([extract_simple_fields(i.toDictionary()) for i in assets])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch assets: {str(e)}")


@app.get("/connect/asset_types")
async def get_asset_types():
    try:
        client = get_adh_client()
        asset_types = client.AssetTypes.getAssetTypes(NAMESPACE_ID)
        return sort_list([extract_simple_fields(i.toDictionary()) for i in asset_types])
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch asset types: {str(e)}"
        )


@app.get("/connect/models")
async def get_models():
    try:
        client = get_adh_client()
        models = client.Assets.getAssets(NAMESPACE_ID, query=ML_MODEL_ASSET_TYPE_QUERY)
        return sort_list([extract_model_fields(i) for i in models])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch models: {str(e)}")


@app.delete("/connect/models", response_model=StatusResponse)
async def delete_models(asset_id: str):
    logging.info("/connect/models")
    try:
        client = get_adh_client()
        client.Assets.deleteAsset(NAMESPACE_ID, asset_id)
        return StatusResponse(status="ok")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete model: {str(e)}")


@app.post("/connect/models", response_model=StatusResponse)
async def post_models(request: ModelCreateRequest):
    logging.info("post /connect/models")
    try:
        reference_type = create_ml_type()
        create_ml_asset(
            id=request.id,
            name=request.name,
            description=request.description,
            model_type=request.model_type,
            sampling_rate=request.sampling_rate,
            past_covariates=request.past_covariates,
            target=request.target,
            future_covariates=request.future_covariates,
            status=request.status,
            training_horizon=request.training_horizon,
            forecast_horizon=request.forecast_horizon,
            update_frequency=request.update_frequency,
            retrain_frequency=request.retrain_frequency,
        )
        return StatusResponse(status="ok")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create model: {str(e)}")


@app.get("/connect/stream_values")
async def get_stream_values(stream_id: str, start: str, end: str, count: int):
    try:
        client = get_adh_client()
        values = client.Streams.getRangeValuesInterpolated(
            NAMESPACE_ID,
            stream_id=stream_id,
            value_class=None,
            start=start,
            end=end,
            count=count,
        )
        return list(values)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch stream values: {str(e)}"
        )


@app.get("/connect/stream_sample_values")
async def get_stream_sample_values(
    stream_id: str, start: str, end: str, intervals: int
):
    try:
        client = get_adh_client()
        values = client.Streams.getSampledValues(
            NAMESPACE_ID,
            stream_id=stream_id,
            value_class=None,
            start=start,
            end=end,
            sample_by="Value",
            intervals=intervals,
        )
        return list(values)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch stream values: {str(e)}"
        )


@app.get("/connect/asset_values")
async def get_asset_values(asset_id: str, start: str, end: str, count: int, stream=[]):
    try:
        client = get_adh_client()
        asset_data = client.Assets.getAssetInterpolatedData(
            NAMESPACE_ID,
            asset_id=asset_id,
            start_index=start,
            end_index=end,
            count=count,
            stream=stream,
        )
        return [item.toDictionary() for item in asset_data]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch asset values: {str(e)}"
        )


@app.get("/connect/model_values")
async def get_model_values(asset_id: str, start: str, end: str, count: int):
    try:
        client = get_adh_client()
        asset = client.Assets.getAssetById(asset_id)
        references = asset.StreamReferences()

        asset_data = client.Assets.getAssetInterpolatedData(
            NAMESPACE_ID,
            asset_id=asset_id,
            start_index=start,
            end_index=end,
            count=count,
        )
        return [item.toDictionary() for item in asset_data]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch asset values: {str(e)}"
        )
